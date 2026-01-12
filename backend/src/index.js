require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const logger = require('./utils/logger');
const Sentry = require('@sentry/node');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: 0.1, // Adjusted to 10% sample rate for performance
  beforeSend(event) {
    // Sanitize sensitive data
    if (event.request && event.request.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['x-admin-api-key'];
    }
    return event;
  }
});

// Add error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  Sentry.captureException(err);
  // Don't exit, just log
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
  Sentry.captureException(reason);
  // Don't exit, just log
});

const { redis, healthCheck } = require('./config/redis');
const {
  validateScoreSubmission,
  validateTopLimit,
  validatePlayerId,
  validateTimeRange
} = require('./middleware/validation');
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');

const { optionalAuth } = require('./middleware/auth');
const { scoreSubmissionLimiter, apiLimiter } = require('./middleware/rateLimiter');
const {
  addScore,
  getTopPlayers,
  getPlayerRank,
  getPlayersAround,
  deletePlayer,
  addScoreWithoutPublish
} = require('./utils/leaderboard');

// Socket.io imports
const { initializeSocket } = require('./socket/socketManager');
const { startLiveUpdates, stopLiveUpdates } = require('./socket/liveUpdates');
const { initializePubSub, closePubSub } = require('./socket/pubsub');
const { startDemoMode, stopDemoMode } = require('./demo');

// Admin routes
const { router: adminRouter, addActivity } = require('./routes/admin');

// Player profile routes
const playerRouter = require('./routes/player');
const leaderboardRouter = require('./routes/leaderboard');
const scoreRouter = require('./routes/score');

// Swagger Docs
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Admin Key Security Validation
const { ADMIN_KEY_MIN_LENGTH, WEAK_ADMIN_KEYS } = require('./config/constants');
const adminKey = process.env.ADMIN_API_KEY;

if (process.env.NODE_ENV === 'production' && !adminKey) {
  logger.warn('⚠️  SECURITY WARNING: ADMIN_API_KEY is not set in production! Admin endpoints are unprotected.');
} else if (adminKey) {
  if (adminKey.length < ADMIN_KEY_MIN_LENGTH) {
    logger.warn(`⚠️  SECURITY WARNING: ADMIN_API_KEY is too short (current: ${adminKey.length}, min: ${ADMIN_KEY_MIN_LENGTH}). Use a stronger key.`);
  }

  if (WEAK_ADMIN_KEYS.includes(adminKey.toLowerCase())) {
    logger.error('❌ CRITICAL SECURITY ERROR: Weak ADMIN_API_KEY detected. Server refusing to start.');
    process.exit(1);
  }
}

const app = express();
const server = http.createServer(app);

// Sentry v8+ handles instrumentation differently (often auto-instrumented via Node options)
// We remove the deprecated Handlers middleware to fix the warning.
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Initialize Socket.io
try {
  initializeSocket(server);
  logger.info('Socket.io initialized successfully');
} catch (error) {
  logger.error('Failed to initialize Socket.io:', error);
  process.exit(1);
}

// Middleware
app.use(express.json({ limit: '1mb' })); // Limit request body size

// Request logging
const morgan = require('morgan');
app.use(morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" - :response-time ms',
  {
    stream: logger.stream,
    skip: (req) => req.url === '/health' // Skip health check logging to reduce noise
  }
));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Health check (exempt from rate limiting)
app.get('/health', asyncHandler(async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      server: {
        status: 'running',
        uptime: process.uptime()
      }
    }
  };

  try {
    const redisStatus = await healthCheck();
    health.checks.redis = {
      status: redisStatus.connected ? 'connected' : 'disconnected',
      responseTime: redisStatus.responseTime
    };

    if (!redisStatus.connected) {
      health.status = 'unhealthy';
      health.checks.redis.error = redisStatus.error || 'Redis disconnected';
      return res.status(503).json(health);
    }

    res.status(200).json(health);
  } catch (error) {
    health.status = 'unhealthy';
    health.checks.redis = {
      status: 'disconnected',
      error: error.message
    };
    res.status(503).json(health);
  }
}));

// Periodic Health Checks (every 30 seconds)
setInterval(async () => {
  try {
    const status = await healthCheck();
    if (!status.connected) {
      logger.error('Background Health Check: Redis disconnected');
    } else if (status.responseTime > 100) {
      logger.warn(`Background Health Check: Slow Redis response (${status.responseTime}ms)`);
    }
  } catch (error) {
    logger.error('Background Health Check Failed:', error);
  }
}, 30000);

// API Documentation (excluded from rate limiting)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check


// Mount routes
app.use('/score', scoreRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/player', playerRouter);
app.use('/admin', adminRouter);
app.use('/config', require('./routes/configRoutes'));

// Admin: Get Demo Status
app.get('/admin/demo', optionalAuth, (req, res) => {
  const { isDemoRunning } = require('./demo');
  const demoInterval = parseInt(process.env.DEMO_INTERVAL) || 10000;

  logger.info(`Admin check: Demo Active=${isDemoRunning()}, Interval=${demoInterval}`);

  res.json({
    success: true,
    data: {
      active: isDemoRunning(),
      interval: demoInterval
    }
  });
});

// Admin: Toggle Demo Mode
app.post('/admin/demo', optionalAuth, asyncHandler(async (req, res) => {
  const { enabled } = req.body;
  const { startDemoMode, stopDemoMode, isDemoRunning } = require('./demo');

  logger.info(`Admin toggle request: ${enabled ? 'Enable' : 'Disable'} (Current: ${isDemoRunning()})`);

  if (enabled && !isDemoRunning()) {
    await startDemoMode();
  } else if (!enabled && isDemoRunning()) {
    stopDemoMode();
  }

  res.json({
    success: true,
    data: {
      active: isDemoRunning(),
      message: `Demo mode ${enabled ? 'started' : 'stopped'}`
    }
  });
}));

// Legacy routes for backward compatibility (optional, can be removed if frontend is updated)
// Mapping old routes to new controllers if needed, or just relying on the new structure.
// For now, we'll keep the old paths working by redirecting or re-mounting if strictly necessary,
// but the prompt implies refactoring.
// Let's assume we want to keep the API surface similar or update the frontend.
// The frontend uses:
// /score -> /score (Matches)
// /top/:limit -> /leaderboard/top/:limit (Changed)
// /around/:player -> /leaderboard/around/:player (Changed)
// /daily -> /leaderboard/daily (Changed)
// /weekly -> /leaderboard/weekly (Changed)
// /all -> /leaderboard/all (Changed)
// /player/:id/... -> /player/:id/... (Matches)

// To avoid breaking the frontend immediately, we can alias the old routes to the new routers.
app.use('/', leaderboardRouter); // This mounts /top, /around, /daily, /weekly, /all at root level

// Delete player (admin) - specific route after the router
app.delete('/player/:id', apiLimiter, validatePlayerId, optionalAuth, asyncHandler(async (req, res) => {
  const playerId = req.playerId;

  const success = await deletePlayer(playerId);
  if (!success) {
    return res.status(404).json({
      success: false,
      error: { message: 'Player not found', code: 404 }
    });
  }

  res.json({
    success: true,
    message: 'Player deleted'
  });
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', code: 404 }
  });
});

// Error handler
if (Sentry.Handlers) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  stopLiveUpdates();
  stopDemoMode();
  await closePubSub();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  stopLiveUpdates();
  stopDemoMode();
  await closePubSub();
  server.close(() => {
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Start real-time features
startLiveUpdates();
initializePubSub();

// Start demo mode if enabled
if (process.env.DEMO_MODE === 'true') {
  startDemoMode();
  logger.info('Demo mode enabled - auto-generating fake players');
}

// Export for potential Socket.io integration
module.exports = { app, server };
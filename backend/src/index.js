require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const logger = require('./utils/logger');
const Sentry = require('@sentry/node');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
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

const app = express();
const server = http.createServer(app);

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

// API Documentation (excluded from rate limiting)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health check


// Mount routes
app.use('/score', scoreRouter);
app.use('/leaderboard', leaderboardRouter);
app.use('/player', playerRouter);
app.use('/admin', adminRouter);

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
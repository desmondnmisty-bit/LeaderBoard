require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const logger = require('./utils/logger');

// Add error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Don't exit, just log
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', { reason, promise });
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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Apply general rate limiting to all routes
app.use(apiLimiter);

// Health check
app.get('/health', asyncHandler(async (req, res) => {
  const redisStatus = await healthCheck();
  res.json({
    status: 'ok',
    redis: redisStatus,
    timestamp: new Date().toISOString()
  });
}));

// Score submission
app.post('/score', scoreSubmissionLimiter, validateScoreSubmission, asyncHandler(async (req, res) => {
  const { playerId, playerName, score, metadata } = req.body;

  // Add to all time ranges, but only publish for 'all' to avoid duplicate notifications
  const result = await addScore(playerId, playerName, score, metadata, 'all');
  await addScoreWithoutPublish(playerId, playerName, score, metadata, 'daily');
  await addScoreWithoutPublish(playerId, playerName, score, metadata, 'weekly');

  // Log activity for admin dashboard
  addActivity({
    type: 'score',
    playerId,
    playerName,
    score,
    rank: result.rank
  });

  res.status(201).json({
    success: true,
    data: result
  });
}));

// Top players
app.get('/top/:limit', validateTopLimit, validateTimeRange, asyncHandler(async (req, res) => {
  const limit = req.limit;
  const offset = parseInt(req.query.offset) || 0;
  const timeRange = req.timeRange;

  const players = await getTopPlayers(limit, offset, timeRange);

  res.json({
    success: true,
    data: {
      players,
      total: players.length,
      limit,
      offset,
      timeRange
    }
  });
}));

// Player rank and nearby
app.get('/around/:player', validatePlayerId, validateTimeRange, asyncHandler(async (req, res) => {
  const playerId = req.playerId;
  const timeRange = req.timeRange;

  let range = parseInt(req.query.range) || 5;
  if (isNaN(range) || range < 1 || range > 100) {
    range = 5; // Default to 5 if invalid
  }

  const playerRank = await getPlayerRank(playerId, timeRange);
  if (!playerRank) {
    return res.status(404).json({
      success: false,
      error: { message: 'Player not found', code: 404 }
    });
  }

  const nearby = await getPlayersAround(playerId, range, timeRange);

  res.json({
    success: true,
    data: {
      player: playerRank,
      nearby
    }
  });
}));

// Time-based leaderboards
app.get('/daily', asyncHandler(async (req, res) => {
  // Always returns the current daily leaderboard, does not accept timeRange override
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  const players = await getTopPlayers(limit, offset, 'daily');

  res.json({
    success: true,
    data: {
      players,
      total: players.length,
      limit,
      offset,
      timeRange: 'daily'
    }
  });
}));

app.get('/weekly', asyncHandler(async (req, res) => {
  // Always returns the current weekly leaderboard, does not accept timeRange override
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  const players = await getTopPlayers(limit, offset, 'weekly');

  res.json({
    success: true,
    data: {
      players,
      total: players.length,
      limit,
      offset,
      timeRange: 'weekly'
    }
  });
}));

app.get('/all', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  const offset = parseInt(req.query.offset) || 0;

  const players = await getTopPlayers(limit, offset, 'all');

  res.json({
    success: true,
    data: {
      players,
      total: players.length,
      limit,
      offset,
      timeRange: 'all'
    }
  });
}));

// Delete player (admin)
app.delete('/player/:id', validatePlayerId, optionalAuth, asyncHandler(async (req, res) => {
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

// Admin routes
app.use('/admin', adminRouter);

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
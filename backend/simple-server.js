const express = require('express');
const cors = require('cors');
const { redis, healthCheck } = require('./src/config/redis');
const {
  validateScoreSubmission,
  validateTopLimit,
  validatePlayerId,
  validateTimeRange
} = require('./src/middleware/validation');
const { errorHandler, asyncHandler } = require('./src/middleware/errorHandler');
const { optionalAuth } = require('./src/middleware/auth');
const {
  addScore,
  getTopPlayers,
  getPlayerRank,
  getPlayersAround,
  deletePlayer,
  addScoreWithoutPublish
} = require('./src/utils/leaderboard');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

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
app.post('/score', validateScoreSubmission, asyncHandler(async (req, res) => {
  const { playerId, playerName, score, metadata } = req.body;

  // Add to all time ranges, but only publish for 'all' to avoid duplicate notifications
  const result = await addScore(playerId, playerName, score, metadata, 'all');
  await addScoreWithoutPublish(playerId, playerName, score, metadata, 'daily');
  await addScoreWithoutPublish(playerId, playerName, score, metadata, 'weekly');

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

// Demo leaderboard (simple fake data)
app.get('/demo', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  // Generate fake leaderboard data
  const fakePlayers = [];
  for (let i = 1; i <= 50; i++) {
    fakePlayers.push({
      rank: i,
      playerId: `demo-player-${i}`,
      playerName: `DemoPlayer${i}`,
      score: Math.floor(Math.random() * 100000) + 90000 - (i * 1000), // Decreasing scores
      metadata: {
        level: Math.floor(Math.random() * 50) + 1,
        country: ['US', 'UK', 'DE', 'FR', 'JP'][Math.floor(Math.random() * 5)]
      }
    });
  }

  const players = fakePlayers.slice(offset, offset + limit);

  res.json({
    success: true,
    data: {
      players,
      total: fakePlayers.length,
      limit,
      offset,
      timeRange: 'demo',
      message: 'This is demo data - no Redis required!'
    }
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

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`Leaderboard API server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /health - Health check');
  console.log('  GET  /demo - Demo leaderboard (no Redis required)');
  console.log('  GET  /top/:limit - Top players');
  console.log('  GET  /all - All-time leaderboard');
  console.log('  GET  /daily - Daily leaderboard');
  console.log('  GET  /weekly - Weekly leaderboard');
  console.log('  POST /score - Submit score');
  console.log('  GET  /around/:player - Player rank and nearby');
  console.log('  DELETE /player/:id - Delete player');
});

module.exports = { app, server };
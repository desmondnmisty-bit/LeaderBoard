/**
 * Admin API Routes
 * Protected endpoints for leaderboard management
 */

const express = require('express');
const router = express.Router();
const { redis } = require('../config/redis');
const { adminAuth } = require('../middleware/adminAuth');
const { asyncHandler } = require('../middleware/errorHandler');
const { getCurrentTimeKeys, deletePlayer, getTopPlayers } = require('../utils/leaderboard');

// Apply admin auth to all routes
router.use(adminAuth);

// Store recent activity in memory (last 100 entries)
const recentActivity = [];
const MAX_ACTIVITY_ENTRIES = 100;

// Function to add activity (exported for use in score submission)
const addActivity = (activity) => {
  recentActivity.unshift({
    ...activity,
    timestamp: new Date().toISOString()
  });
  if (recentActivity.length > MAX_ACTIVITY_ENTRIES) {
    recentActivity.pop();
  }
};

/**
 * GET /admin/stats
 * Get system statistics
 */
router.get('/stats', asyncHandler(async (req, res) => {
  const { dailyKey, weeklyKey } = getCurrentTimeKeys();

  // Get player counts for each leaderboard
  const [allCount, dailyCount, weeklyCount] = await Promise.all([
    redis.zcard('leaderboard:all'),
    redis.zcard(`leaderboard:daily:${dailyKey}`),
    redis.zcard(`leaderboard:weekly:${weeklyKey}`)
  ]);

  // Get Redis info
  const redisInfo = await redis.info('server');
  const uptimeMatch = redisInfo.match(/uptime_in_seconds:(\d+)/);
  const redisUptime = uptimeMatch ? parseInt(uptimeMatch[1]) : 0;

  // Get memory info
  const memoryInfo = await redis.info('memory');
  const usedMemoryMatch = memoryInfo.match(/used_memory_human:([^\r\n]+)/);
  const usedMemory = usedMemoryMatch ? usedMemoryMatch[1] : 'N/A';

  // Count scores submitted today (from activity log)
  const today = new Date().toISOString().split('T')[0];
  const scoresToday = recentActivity.filter(a => 
    a.type === 'score' && a.timestamp.startsWith(today)
  ).length;

  res.json({
    success: true,
    data: {
      players: {
        all: allCount,
        daily: dailyCount,
        weekly: weeklyCount
      },
      scoresToday,
      redis: {
        status: 'connected',
        uptime: redisUptime,
        memory: usedMemory
      },
      serverUptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /admin/players
 * Get paginated player list with search
 */
router.get('/players', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search || '';
  const timeRange = req.query.timeRange || 'all';

  const players = await getTopPlayers(limit + offset, 0, timeRange);
  
  let filteredPlayers = players;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredPlayers = players.filter(p => 
      p.playerName.toLowerCase().includes(searchLower) ||
      p.playerId.toLowerCase().includes(searchLower)
    );
  }

  const paginatedPlayers = filteredPlayers.slice(offset, offset + limit);

  res.json({
    success: true,
    data: {
      players: paginatedPlayers,
      total: filteredPlayers.length,
      limit,
      offset,
      timeRange
    }
  });
}));

/**
 * DELETE /admin/player/:id
 * Delete a player from all leaderboards
 */
router.delete('/player/:id', asyncHandler(async (req, res) => {
  const playerId = req.params.id;

  if (!playerId || playerId.length < 1) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid player ID', code: 400 }
    });
  }

  const success = await deletePlayer(playerId);
  
  if (!success) {
    return res.status(404).json({
      success: false,
      error: { message: 'Player not found', code: 404 }
    });
  }

  // Log activity
  addActivity({
    type: 'delete',
    playerId,
    action: 'Player deleted by admin'
  });

  res.json({
    success: true,
    message: `Player ${playerId} deleted from all leaderboards`
  });
}));

/**
 * POST /admin/reset/:timeRange
 * Reset a leaderboard
 */
router.post('/reset/:timeRange', asyncHandler(async (req, res) => {
  const { timeRange } = req.params;
  const { dailyKey, weeklyKey } = getCurrentTimeKeys();

  let keysDeleted = 0;
  let playersAffected = 0;

  if (timeRange === 'daily') {
    const key = `leaderboard:daily:${dailyKey}`;
    playersAffected = await redis.zcard(key);
    keysDeleted = await redis.del(key);
  } else if (timeRange === 'weekly') {
    const key = `leaderboard:weekly:${weeklyKey}`;
    playersAffected = await redis.zcard(key);
    keysDeleted = await redis.del(key);
  } else if (timeRange === 'all') {
    // This is dangerous - require confirmation
    const confirm = req.body.confirm;
    if (confirm !== 'DELETE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        error: { 
          message: 'Confirmation required. Send { "confirm": "DELETE_ALL_DATA" } in body.', 
          code: 400 
        }
      });
    }

    playersAffected = await redis.zcard('leaderboard:all');
    
    // Use SCAN instead of KEYS to avoid blocking Redis
    const keysToDelete = [];
    
    // Scan for player keys
    let cursor = '0';
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'player:*', 'COUNT', 100);
      cursor = newCursor;
      keysToDelete.push(...keys);
    } while (cursor !== '0');
    
    // Scan for profile keys
    cursor = '0';
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'profile:*', 'COUNT', 100);
      cursor = newCursor;
      keysToDelete.push(...keys);
    } while (cursor !== '0');
    
    // Scan for history keys
    cursor = '0';
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'history:*', 'COUNT', 100);
      cursor = newCursor;
      keysToDelete.push(...keys);
    } while (cursor !== '0');
    
    // Scan for leaderboard keys
    cursor = '0';
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', 'leaderboard:*', 'COUNT', 100);
      cursor = newCursor;
      keysToDelete.push(...keys);
    } while (cursor !== '0');
    
    // Delete in batches to avoid blocking
    if (keysToDelete.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize);
        keysDeleted += await redis.del(...batch);
      }
    }
  } else {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid time range. Use: daily, weekly, or all', code: 400 }
    });
  }

  // Log activity
  addActivity({
    type: 'reset',
    timeRange,
    playersAffected,
    action: `${timeRange} leaderboard reset by admin`
  });

  res.json({
    success: true,
    message: `${timeRange} leaderboard reset successfully`,
    data: {
      keysDeleted,
      playersAffected
    }
  });
}));

/**
 * GET /admin/activity
 * Get recent activity feed
 */
router.get('/activity', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  
  res.json({
    success: true,
    data: {
      activity: recentActivity.slice(0, limit),
      total: recentActivity.length
    }
  });
}));

/**
 * GET /admin/leaderboards
 * Get overview of all leaderboards
 */
router.get('/leaderboards', asyncHandler(async (req, res) => {
  const { dailyKey, weeklyKey } = getCurrentTimeKeys();

  const [allPlayers, dailyPlayers, weeklyPlayers] = await Promise.all([
    getTopPlayers(10, 0, 'all'),
    getTopPlayers(10, 0, 'daily'),
    getTopPlayers(10, 0, 'weekly')
  ]);

  const [allCount, dailyCount, weeklyCount] = await Promise.all([
    redis.zcard('leaderboard:all'),
    redis.zcard(`leaderboard:daily:${dailyKey}`),
    redis.zcard(`leaderboard:weekly:${weeklyKey}`)
  ]);

  res.json({
    success: true,
    data: {
      all: {
        key: 'leaderboard:all',
        totalPlayers: allCount,
        topPlayers: allPlayers
      },
      daily: {
        key: `leaderboard:daily:${dailyKey}`,
        totalPlayers: dailyCount,
        topPlayers: dailyPlayers,
        expiresIn: '24 hours'
      },
      weekly: {
        key: `leaderboard:weekly:${weeklyKey}`,
        totalPlayers: weeklyCount,
        topPlayers: weeklyPlayers,
        expiresIn: '7 days'
      }
    }
  });
}));

module.exports = { router, addActivity };

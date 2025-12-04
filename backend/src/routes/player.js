/**
 * Player Profile Routes
 * Endpoints for player profiles, avatars, and stats
 */

const express = require('express');
const router = express.Router();
const { redis } = require('../config/redis');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPlayerRank, getCurrentTimeKeys } = require('../utils/leaderboard');
const { sanitizeBio, sanitizeString } = require('../utils/sanitizer');
const validator = require('validator');

// Valid ISO 3166-1 alpha-2 country codes (common ones)
const VALID_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'CN', 'IN', 'BR',
  'KR', 'MX', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI', 'PL',
  'RU', 'UA', 'TR', 'SA', 'AE', 'SG', 'MY', 'TH', 'ID', 'PH',
  'VN', 'NZ', 'ZA', 'EG', 'NG', 'KE', 'AR', 'CL', 'CO', 'PE'
];

/**
 * GET /player/:id/profile
 * Get full player profile
 */
router.get('/:id/profile', asyncHandler(async (req, res) => {
  const playerId = req.params.id;

  if (!playerId || playerId.length < 1 || playerId.length > 100) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid player ID', code: 400 }
    });
  }

  const playerKey = `player:${playerId}`;
  const playerData = await redis.hgetall(playerKey);

  if (!playerData || !playerData.name) {
    return res.status(404).json({
      success: false,
      error: { message: 'Player not found', code: 404 }
    });
  }

  // Get ranks across all time ranges
  const [allRank, dailyRank, weeklyRank] = await Promise.all([
    getPlayerRank(playerId, 'all'),
    getPlayerRank(playerId, 'daily'),
    getPlayerRank(playerId, 'weekly')
  ]);

  const profile = {
    playerId,
    playerName: playerData.name,
    score: parseFloat(playerData.score) || 0,
    avatarUrl: playerData.avatarUrl || null,
    bio: playerData.bio || null,
    country: playerData.country || null,
    joinedAt: playerData.joinedAt || playerData.lastUpdated || null,
    lastUpdated: playerData.lastUpdated || null,
    metadata: playerData.metadata ? JSON.parse(playerData.metadata) : {},
    ranks: {
      all: allRank?.rank || null,
      daily: dailyRank?.rank || null,
      weekly: weeklyRank?.rank || null
    }
  };

  res.json({
    success: true,
    data: profile
  });
}));

/**
 * PUT /player/:id/profile
 * Update player profile (avatar, bio, country)
 */
router.put('/:id/profile', asyncHandler(async (req, res) => {
  const playerId = req.params.id;
  const { avatarUrl, bio, country } = req.body;

  if (!playerId || playerId.length < 1 || playerId.length > 100) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid player ID', code: 400 }
    });
  }

  const playerKey = `player:${playerId}`;
  const exists = await redis.exists(playerKey);

  if (!exists) {
    return res.status(404).json({
      success: false,
      error: { message: 'Player not found', code: 404 }
    });
  }

  const updates = {};

  // Validate and set avatar URL
  if (avatarUrl !== undefined) {
    if (avatarUrl === null || avatarUrl === '') {
      updates.avatarUrl = '';
    } else if (typeof avatarUrl === 'string' && avatarUrl.length <= 500) {
      if (validator.isURL(avatarUrl, { protocols: ['http', 'https'], require_protocol: true })) {
        updates.avatarUrl = avatarUrl;
      } else {
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid avatar URL format', code: 400 }
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        error: { message: 'Avatar URL must be a string under 500 characters', code: 400 }
      });
    }
  }

  // Validate and set bio
  if (bio !== undefined) {
    if (bio === null || bio === '') {
      updates.bio = '';
    } else if (typeof bio === 'string') {
      const sanitized = sanitizeBio(bio, 200);
      if (sanitized === null) {
        return res.status(400).json({
          success: false,
          error: { message: 'Bio must be a string under 200 characters', code: 400 }
        });
      }
      updates.bio = sanitized;
    } else {
      return res.status(400).json({
        success: false,
        error: { message: 'Bio must be a string under 200 characters', code: 400 }
      });
    }
  }

  // Validate and set country
  if (country !== undefined) {
    if (country === null || country === '') {
      updates.country = '';
    } else if (typeof country === 'string' && VALID_COUNTRIES.includes(country.toUpperCase())) {
      updates.country = country.toUpperCase();
    } else {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid country code', code: 400 }
      });
    }
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      error: { message: 'No valid fields to update', code: 400 }
    });
  }

  // Update player data
  updates.lastUpdated = Date.now().toString();
  await redis.hset(playerKey, updates);

  // Get updated profile
  const playerData = await redis.hgetall(playerKey);

  res.json({
    success: true,
    data: {
      playerId,
      playerName: playerData.name,
      avatarUrl: playerData.avatarUrl || null,
      bio: playerData.bio || null,
      country: playerData.country || null,
      lastUpdated: playerData.lastUpdated
    }
  });
}));

/**
 * GET /player/:id/stats
 * Get player statistics across all time ranges
 */
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const playerId = req.params.id;

  if (!playerId || playerId.length < 1 || playerId.length > 100) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid player ID', code: 400 }
    });
  }

  const playerKey = `player:${playerId}`;
  const playerData = await redis.hgetall(playerKey);

  if (!playerData || !playerData.name) {
    return res.status(404).json({
      success: false,
      error: { message: 'Player not found', code: 404 }
    });
  }

  const { dailyKey, weeklyKey } = getCurrentTimeKeys();

  // Get scores and ranks for each time range
  const [allScore, dailyScore, weeklyScore] = await Promise.all([
    redis.zscore('leaderboard:all', playerId),
    redis.zscore(`leaderboard:daily:${dailyKey}`, playerId),
    redis.zscore(`leaderboard:weekly:${weeklyKey}`, playerId)
  ]);

  const [allRank, dailyRank, weeklyRank] = await Promise.all([
    getPlayerRank(playerId, 'all'),
    getPlayerRank(playerId, 'daily'),
    getPlayerRank(playerId, 'weekly')
  ]);

  // Get total players in each leaderboard
  const [allTotal, dailyTotal, weeklyTotal] = await Promise.all([
    redis.zcard('leaderboard:all'),
    redis.zcard(`leaderboard:daily:${dailyKey}`),
    redis.zcard(`leaderboard:weekly:${weeklyKey}`)
  ]);

  res.json({
    success: true,
    data: {
      playerId,
      playerName: playerData.name,
      stats: {
        allTime: {
          score: allScore ? parseFloat(allScore) : null,
          rank: allRank?.rank || null,
          totalPlayers: allTotal,
          percentile: (allRank && allTotal > 0) ? Math.round(((allTotal - allRank.rank + 1) / allTotal) * 100) : null
        },
        daily: {
          score: dailyScore ? parseFloat(dailyScore) : null,
          rank: dailyRank?.rank || null,
          totalPlayers: dailyTotal,
          percentile: (dailyRank && dailyTotal > 0) ? Math.round(((dailyTotal - dailyRank.rank + 1) / dailyTotal) * 100) : null
        },
        weekly: {
          score: weeklyScore ? parseFloat(weeklyScore) : null,
          rank: weeklyRank?.rank || null,
          totalPlayers: weeklyTotal,
          percentile: (weeklyRank && weeklyTotal > 0) ? Math.round(((weeklyTotal - weeklyRank.rank + 1) / weeklyTotal) * 100) : null
        }
      }
    }
  });
}));

/**
 * GET /player/:id/history
 * Get player score history
 */
router.get('/:id/history', asyncHandler(async (req, res) => {
  const playerId = req.params.id;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const offset = parseInt(req.query.offset) || 0;

  if (!playerId || playerId.length < 1 || playerId.length > 100) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid player ID', code: 400 }
    });
  }

  const playerKey = `player:${playerId}`;
  const playerData = await redis.hgetall(playerKey);

  if (!playerData || !playerData.name) {
    return res.status(404).json({
      success: false,
      error: { message: 'Player not found', code: 404 }
    });
  }

  const historyKey = `history:${playerId}`;
  
  // Get history entries (stored newest first)
  const historyRaw = await redis.lrange(historyKey, offset, offset + limit - 1);
  const totalEntries = await redis.llen(historyKey);

  const history = historyRaw.map((entry, index) => {
    try {
      const parsed = JSON.parse(entry);
      return {
        index: offset + index,
        // Support both old format (score) and new format (totalScore)
        score: parsed.totalScore ?? parsed.score,
        scoreAdded: parsed.scoreAdded,
        previousScore: parsed.previousScore,
        timestamp: parsed.timestamp,
        date: new Date(parsed.timestamp).toISOString(),
        metadata: parsed.metadata || {}
      };
    } catch {
      return null;
    }
  }).filter(Boolean);

  // Reverse to show oldest first for charting
  const chronological = [...history].reverse();

  res.json({
    success: true,
    data: {
      playerId,
      playerName: playerData.name,
      history: chronological,
      total: totalEntries,
      limit,
      offset
    }
  });
}));

module.exports = router;

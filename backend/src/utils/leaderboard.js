const { redis } = require('../config/redis');
const { getWeek, getYear, format } = require('date-fns');

// ============================================
// CONSTANTS (should use from config, but inlined for now)
// ============================================
const TTL = {
  DAILY: 24 * 60 * 60,           // 24 hours
  WEEKLY: 7 * 24 * 60 * 60,      // 7 days
  PLAYER: 30 * 24 * 60 * 60,     // 30 days
  HISTORY: 90 * 24 * 60 * 60     // 90 days
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getCurrentTimeKeys = () => {
  const now = new Date();
  const dailyKey = format(now, 'yyyy-MM-dd');
  const weekNumber = getWeek(now, { weekStartsOn: 1 });
  const year = getYear(now);
  const weeklyKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;
  return { dailyKey, weeklyKey };
};

/**
 * Get the Redis key for a leaderboard based on time range
 */
const getLeaderboardKey = (timeRange, dailyKey, weeklyKey) => {
  switch (timeRange) {
    case 'daily': return `leaderboard:daily:${dailyKey}`;
    case 'weekly': return `leaderboard:weekly:${weeklyKey}`;
    default: return 'leaderboard:all';
  }
};

/**
 * Set TTL for time-based leaderboards
 */
const setLeaderboardTTL = async (key, timeRange) => {
  if (timeRange === 'daily') {
    await redis.expire(key, TTL.DAILY);
  } else if (timeRange === 'weekly') {
    await redis.expire(key, TTL.WEEKLY);
  }
};

// ============================================
// CORE SCORE FUNCTION (single implementation)
// ============================================

/**
 * Add or update a player's score
 * @param {Object} options
 * @param {string} options.playerId - Player identifier
 * @param {string} options.playerName - Display name
 * @param {number} options.score - Score value
 * @param {Object} [options.metadata={}] - Additional player data
 * @param {string} [options.timeRange='all'] - Time range: 'all', 'daily', 'weekly'
 * @param {boolean} [options.publish=true] - Publish update via Redis pub/sub
 * @param {boolean} [options.storeHistory=true] - Store in history list
 * @returns {Promise<{playerId, score, rank, updated}>}
 */
const addScoreInternal = async ({ 
  playerId, 
  playerName, 
  score, 
  metadata = {}, 
  timeRange = 'all',
  publish = true,
  storeHistory = true
}) => {
  if (!redis) {
    throw new Error('Redis connection required but not available');
  }

  const { dailyKey, weeklyKey } = getCurrentTimeKeys();
  const key = getLeaderboardKey(timeRange, dailyKey, weeklyKey);

  // Use Redis transaction to prevent race conditions
  const multi = redis.multi();

  // Check existing score - we'll compare after the transaction
  const existingScore = await redis.zscore(key, playerId);
  
  // Only update if new score is higher (or no existing score)
  if (existingScore !== null && parseFloat(existingScore) >= score) {
    const rank = await redis.zrevrank(key, playerId);
    return { 
      playerId, 
      score: parseFloat(existingScore), 
      rank: rank !== null ? rank + 1 : null, 
      updated: false 
    };
  }

  // Add to sorted set
  multi.zadd(key, score, playerId);

  // Set TTL for time-based leaderboards
  if (timeRange === 'daily') {
    multi.expire(key, TTL.DAILY);
  } else if (timeRange === 'weekly') {
    multi.expire(key, TTL.WEEKLY);
  }

  // Store player data
  const playerKey = `player:${playerId}`;
  multi.hset(playerKey, {
    name: playerName,
    score: score.toString(),
    metadata: JSON.stringify(metadata),
    lastUpdated: Date.now().toString()
  });
  multi.expire(playerKey, TTL.PLAYER);

  // Store history (only for 'all' timeRange to avoid duplicates)
  if (storeHistory && timeRange === 'all') {
    const historyKey = `history:${playerId}`;
    const historyEntry = JSON.stringify({
      score,
      timestamp: Date.now(),
      metadata
    });
    multi.lpush(historyKey, historyEntry);
    multi.ltrim(historyKey, 0, 99);
    multi.expire(historyKey, TTL.HISTORY);
  }

  // Execute transaction
  await multi.exec();

  // Publish score update (outside transaction, non-critical)
  if (publish) {
    try {
      await redis.publish('score-update', JSON.stringify({ 
        playerId, playerName, score, timeRange 
      }));
    } catch (publishError) {
      console.error('Failed to publish score update:', publishError.message);
    }
  }

  // Get final rank
  const rank = await redis.zrevrank(key, playerId);
  return { playerId, score, rank: rank !== null ? rank + 1 : null, updated: true };
};

// ============================================
// PUBLIC API (simple wrappers around internal)
// ============================================

const addScore = async (playerId, playerName, score, metadata = {}, timeRange = 'all') => {
  return addScoreInternal({ playerId, playerName, score, metadata, timeRange, publish: true, storeHistory: true });
};

const addScoreWithoutPublish = async (playerId, playerName, score, metadata = {}, timeRange = 'all') => {
  return addScoreInternal({ playerId, playerName, score, metadata, timeRange, publish: false, storeHistory: false });
};

// ============================================
// QUERY FUNCTIONS
// ============================================

const getTopPlayers = async (limit, offset = 0, timeRange = 'all') => {
  if (!redis) {
    throw new Error('Redis connection required but not available');
  }

  try {
    const { dailyKey, weeklyKey } = getCurrentTimeKeys();
    const key = getLeaderboardKey(timeRange, dailyKey, weeklyKey);

    const players = await redis.zrevrange(key, offset, offset + limit - 1, 'WITHSCORES');

    if (players.length === 0) {
      return [];
    }

    // Extract player IDs
    const playerIds = [];
    for (let i = 0; i < players.length; i += 2) {
      playerIds.push(players[i]);
    }

    // Batch fetch player and profile data
    const pipeline = redis.pipeline();
    for (const id of playerIds) {
      pipeline.hgetall(`player:${id}`);
      pipeline.hgetall(`profile:${id}`);
    }
    const results = await pipeline.exec();

    // Build result array
    const result = [];
    for (let i = 0; i < playerIds.length; i++) {
      const playerId = playerIds[i];
      const score = parseFloat(players[i * 2 + 1]);
      const rank = offset + i + 1;

      const [playerErr, playerData] = results[i * 2];
      const [profileErr, profileData] = results[i * 2 + 1];

      if (!playerErr && playerData && playerData.name) {
        result.push({
          rank,
          playerId,
          playerName: playerData.name,
          score,
          metadata: playerData.metadata ? JSON.parse(playerData.metadata) : {},
          avatarUrl: (!profileErr && profileData?.avatarUrl) || null,
          country: (!profileErr && profileData?.country) || null
        });
      }
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to get top players: ${error.message}`);
  }
};

const getPlayerRank = async (playerId, timeRange = 'all') => {
  if (!redis) {
    throw new Error('Redis connection required but not available');
  }

  try {
    const { dailyKey, weeklyKey } = getCurrentTimeKeys();
    const key = getLeaderboardKey(timeRange, dailyKey, weeklyKey);

    const [rank, score] = await Promise.all([
      redis.zrevrank(key, playerId),
      redis.zscore(key, playerId)
    ]);

    if (rank === null || score === null) {
      return null;
    }

    return { rank: rank + 1, score: parseFloat(score) };
  } catch (error) {
    throw new Error(`Failed to get player rank: ${error.message}`);
  }
};

const getPlayersAround = async (playerId, range = 5, timeRange = 'all') => {
  try {
    const playerRank = await getPlayerRank(playerId, timeRange);
    if (!playerRank) {
      return [];
    }

    const start = Math.max(0, playerRank.rank - range - 1);
    const end = playerRank.rank + range - 1;

    return await getTopPlayers(end - start + 1, start, timeRange);
  } catch (error) {
    throw new Error(`Failed to get players around: ${error.message}`);
  }
};

const deletePlayer = async (playerId) => {
  if (!redis) {
    throw new Error('Redis connection required but not available');
  }

  try {
    const { dailyKey, weeklyKey } = getCurrentTimeKeys();

    // Check if player exists
    const playerExists = await redis.exists(`player:${playerId}`);
    if (!playerExists) {
      return false;
    }

    // Use pipeline for atomic deletion
    const pipeline = redis.pipeline();
    
    // Remove from all leaderboards
    pipeline.zrem('leaderboard:all', playerId);
    pipeline.zrem(`leaderboard:daily:${dailyKey}`, playerId);
    pipeline.zrem(`leaderboard:weekly:${weeklyKey}`, playerId);
    
    // Delete all player data
    pipeline.del(`player:${playerId}`);
    pipeline.del(`profile:${playerId}`);
    pipeline.del(`history:${playerId}`);

    const results = await pipeline.exec();
    
    // Count successful deletions
    const deletedCount = results.reduce((sum, [err, result]) => {
      return sum + (err ? 0 : (result || 0));
    }, 0);

    return deletedCount > 0;
  } catch (error) {
    throw new Error(`Failed to delete player: ${error.message}`);
  }
};

module.exports = {
  addScore,
  addScoreWithoutPublish,
  getTopPlayers,
  getPlayerRank,
  getPlayersAround,
  deletePlayer,
  getCurrentTimeKeys,
  getLeaderboardKey
};
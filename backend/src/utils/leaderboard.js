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
 * Add or update a player's score - updates ALL time ranges at once
 * @param {Object} options
 * @param {string} options.playerId - Player identifier
 * @param {string} options.playerName - Display name
 * @param {number} options.score - Score value to ADD to current totals
 * @param {Object} [options.metadata={}] - Additional player data
 * @param {boolean} [options.publish=true] - Publish update via Redis pub/sub
 * @param {boolean} [options.storeHistory=true] - Store in history list
 * @returns {Promise<{playerId, score, rank, updated}>}
 */
const addScoreInternal = async ({ 
  playerId, 
  playerName, 
  score, 
  metadata = {}, 
  publish = true,
  storeHistory = true
}) => {
  if (!redis) {
    throw new Error('Redis connection required but not available');
  }

  const { dailyKey, weeklyKey } = getCurrentTimeKeys();
  const allKey = 'leaderboard:all';
  const dailyKeyFull = `leaderboard:daily:${dailyKey}`;
  const weeklyKeyFull = `leaderboard:weekly:${weeklyKey}`;

  // Get existing scores from ALL leaderboards
  const [existingAll, existingDaily, existingWeekly] = await Promise.all([
    redis.zscore(allKey, playerId),
    redis.zscore(dailyKeyFull, playerId),
    redis.zscore(weeklyKeyFull, playerId)
  ]);

  const currentScoreAll = existingAll ? parseFloat(existingAll) : 0;
  const currentScoreDaily = existingDaily ? parseFloat(existingDaily) : 0;
  const currentScoreWeekly = existingWeekly ? parseFloat(existingWeekly) : 0;

  const newTotalAll = currentScoreAll + score;
  const newTotalDaily = currentScoreDaily + score;
  const newTotalWeekly = currentScoreWeekly + score;
  
  // Store history for tracking
  if (storeHistory) {
    const historyKey = `history:${playerId}`;
    const historyEntry = JSON.stringify({
      scoreAdded: score,
      totalScore: newTotalAll,
      previousScore: currentScoreAll,
      timestamp: Date.now(),
      metadata
    });
    await redis.lpush(historyKey, historyEntry);
    await redis.ltrim(historyKey, 0, 99);
    await redis.expire(historyKey, TTL.HISTORY);
  }

  // Update ALL leaderboards in a single transaction
  const multi = redis.multi();

  // Add to all three sorted sets
  multi.zadd(allKey, newTotalAll, playerId);
  multi.zadd(dailyKeyFull, newTotalDaily, playerId);
  multi.zadd(weeklyKeyFull, newTotalWeekly, playerId);

  // Set TTL for time-based leaderboards
  multi.expire(dailyKeyFull, TTL.DAILY);
  multi.expire(weeklyKeyFull, TTL.WEEKLY);

  // Store player data (use all-time score as the main score)
  const playerKey = `player:${playerId}`;
  multi.hset(playerKey, {
    name: playerName,
    score: newTotalAll.toString(),
    metadata: JSON.stringify(metadata),
    lastUpdated: Date.now().toString()
  });
  multi.expire(playerKey, TTL.PLAYER);

  // Execute transaction
  await multi.exec();

  // Publish score update
  if (publish) {
    try {
      await redis.publish('score-update', JSON.stringify({ 
        playerId, 
        playerName, 
        score: newTotalAll, 
        scoreAdded: score,
        daily: newTotalDaily,
        weekly: newTotalWeekly
      }));
    } catch (publishError) {
      console.error('Failed to publish score update:', publishError.message);
    }
  }

  // Get final rank from all-time leaderboard
  const rank = await redis.zrevrank(allKey, playerId);
  return { 
    playerId, 
    score: newTotalAll, 
    scoreAdded: score, 
    previousScore: currentScoreAll, 
    rank: rank !== null ? rank + 1 : null, 
    updated: true 
  };
};

// ============================================
// PUBLIC API (simple wrappers around internal)
// ============================================

const addScore = async (playerId, playerName, score, metadata = {}) => {
  return addScoreInternal({ playerId, playerName, score, metadata, publish: true, storeHistory: true });
};

const addScoreWithoutPublish = async (playerId, playerName, score, metadata = {}) => {
  return addScoreInternal({ playerId, playerName, score, metadata, publish: false, storeHistory: false });
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

    // Batch fetch player data (profile fields are stored in same key)
    const pipeline = redis.pipeline();
    for (const id of playerIds) {
      pipeline.hgetall(`player:${id}`);
    }
    const results = await pipeline.exec();

    // Build result array
    const result = [];
    for (let i = 0; i < playerIds.length; i++) {
      const playerId = playerIds[i];
      const score = parseFloat(players[i * 2 + 1]);
      const rank = offset + i + 1;

      const [playerErr, playerData] = results[i];

      if (!playerErr && playerData && playerData.name) {
        result.push({
          rank,
          playerId,
          playerName: playerData.name,
          score,
          metadata: playerData.metadata ? JSON.parse(playerData.metadata) : {},
          avatarUrl: playerData.avatarUrl || null,
          country: playerData.country || null
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
    
    // Delete all player data (profile is stored in player key)
    pipeline.del(`player:${playerId}`);
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
const { redis } = require('../config/redis');
const { getWeek, getYear, format } = require('date-fns');

const getCurrentTimeKeys = () => {
  const now = new Date();
  
  // Daily key: YYYY-MM-DD format
  const dailyKey = format(now, 'yyyy-MM-dd');
  
  // Weekly key using ISO week standard (ISO 8601 compliant)
  const weekNumber = getWeek(now, { weekStartsOn: 1 }); // Monday as first day
  const year = getYear(now);
  const weeklyKey = `${year}-W${String(weekNumber).padStart(2, '0')}`;

  return { dailyKey, weeklyKey };
};

const addScoreWithoutPublish = async (playerId, playerName, score, metadata = {}, timeRange = 'all') => {
  if (!redis) {
    throw new Error('Redis connection required but not available');
  }

  try {
    const { dailyKey, weeklyKey } = getCurrentTimeKeys();

    const key = timeRange === 'all' ? 'leaderboard:all' :
                timeRange === 'daily' ? `leaderboard:daily:${dailyKey}` :
                `leaderboard:weekly:${weeklyKey}`;

    // Add to sorted set
    await redis.zadd(key, score, playerId);

    // Set TTL for time-based leaderboards
    if (timeRange === 'daily') {
      await redis.expire(key, 24 * 60 * 60); // 24 hours
    } else if (timeRange === 'weekly') {
      await redis.expire(key, 7 * 24 * 60 * 60); // 7 days
    }

    // Store player data
    const playerKey = `player:${playerId}`;
    await redis.hset(playerKey, {
      name: playerName,
      score: score.toString(),
      metadata: JSON.stringify(metadata),
      lastUpdated: Date.now().toString()
    });
    
    // Set TTL for player data (30 days)
    await redis.expire(playerKey, 30 * 24 * 60 * 60);

    // Get rank
    const rank = await redis.zrevrank(key, playerId);
    return { playerId, score, rank: rank + 1 }; // 1-indexed
  } catch (error) {
    throw new Error(`Failed to add score: ${error.message}`);
  }
};

const addScore = async (playerId, playerName, score, metadata = {}, timeRange = 'all') => {
  if (!redis) {
    throw new Error('Redis connection required but not available');
  }

  try {
    const { dailyKey, weeklyKey } = getCurrentTimeKeys();

    const key = timeRange === 'all' ? 'leaderboard:all' :
                timeRange === 'daily' ? `leaderboard:daily:${dailyKey}` :
                `leaderboard:weekly:${weeklyKey}`;

    // Add to sorted set
    await redis.zadd(key, score, playerId);

    // Set TTL for time-based leaderboards
    if (timeRange === 'daily') {
      await redis.expire(key, 24 * 60 * 60); // 24 hours
    } else if (timeRange === 'weekly') {
      await redis.expire(key, 7 * 24 * 60 * 60); // 7 days
    }

    // Store player data
    const playerKey = `player:${playerId}`;
    await redis.hset(playerKey, {
      name: playerName,
      score: score.toString(),
      metadata: JSON.stringify(metadata),
      lastUpdated: Date.now().toString()
    });
    
    // Set TTL for player data (30 days)
    await redis.expire(playerKey, 30 * 24 * 60 * 60);

    // Publish score update for real-time notifications
    try {
      await redis.publish('score-update', JSON.stringify({ playerId, playerName, score, timeRange }));
    } catch (publishError) {
      console.error('Failed to publish score update:', publishError);
      // Don't fail the score submission if publish fails
    }

    // Store score in history (only for 'all' timeRange to avoid duplicates)
    if (timeRange === 'all') {
      const historyKey = `history:${playerId}`;
      const historyEntry = JSON.stringify({
        score,
        timestamp: Date.now(),
        metadata
      });
      // Push to list and trim to keep only last 100 entries
      await redis.lpush(historyKey, historyEntry);
      await redis.ltrim(historyKey, 0, 99);
      // Set TTL for history (90 days)
      await redis.expire(historyKey, 90 * 24 * 60 * 60);
    }

    // Get rank
    const rank = await redis.zrevrank(key, playerId);
    return { playerId, score, rank: rank + 1 }; // 1-indexed
  } catch (error) {
    throw new Error(`Failed to add score: ${error.message}`);
  }
};

const getTopPlayers = async (limit, offset = 0, timeRange = 'all') => {
  if (!redis) {
    throw new Error('Redis connection required but not available');
  }

  try {
    const { dailyKey, weeklyKey } = getCurrentTimeKeys();

    const key = timeRange === 'all' ? 'leaderboard:all' :
                timeRange === 'daily' ? `leaderboard:daily:${dailyKey}` :
                `leaderboard:weekly:${weeklyKey}`;

    const players = await redis.zrevrange(key, offset, offset + limit - 1, 'WITHSCORES');

    const result = [];
    
    // Batch fetch player data using pipeline
    if (players.length > 0) {
      const pipeline = redis.pipeline();
      const playerIds = [];
      
      for (let i = 0; i < players.length; i += 2) {
        const playerId = players[i];
        playerIds.push(playerId);
        pipeline.hgetall(`player:${playerId}`);
      }
      
      const playerDataResults = await pipeline.exec();
      
      // Also fetch profile data
      const profilePipeline = redis.pipeline();
      for (const playerId of playerIds) {
        profilePipeline.hgetall(`profile:${playerId}`);
      }
      const profileDataResults = await profilePipeline.exec();
      
      for (let i = 0; i < playerIds.length; i++) {
        const playerId = playerIds[i];
        const score = parseFloat(players[i * 2 + 1]);
        const rank = offset + i + 1;
        
        const [err, playerData] = playerDataResults[i];
        const [profileErr, profileData] = profileDataResults[i];
        
        if (!err && playerData && playerData.name) {
          result.push({
            rank,
            playerId,
            playerName: playerData.name,
            score,
            metadata: playerData.metadata ? JSON.parse(playerData.metadata) : {},
            // Include profile data if available
            avatarUrl: (!profileErr && profileData?.avatarUrl) || null,
            country: (!profileErr && profileData?.country) || null
          });
        }
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

    const key = timeRange === 'all' ? 'leaderboard:all' :
                timeRange === 'daily' ? `leaderboard:daily:${dailyKey}` :
                `leaderboard:weekly:${weeklyKey}`;

    const rank = await redis.zrevrank(key, playerId);
    const score = await redis.zscore(key, playerId);

    if (rank === null || score === null) {
      return null;
    }

    return { rank: rank + 1, score: parseFloat(score) }; // 1-indexed
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

    // Note: This only removes the player from current daily/weekly leaderboards.
    // Historical entries will be removed automatically via TTL.

    // Check if player exists
    const playerExists = await redis.exists(`player:${playerId}`);
    if (!playerExists) {
      return false;
    }

    // Remove from all leaderboards
    const allRemoved = await redis.zrem('leaderboard:all', playerId);
    const dailyRemoved = await redis.zrem(`leaderboard:daily:${dailyKey}`, playerId);
    const weeklyRemoved = await redis.zrem(`leaderboard:weekly:${weeklyKey}`, playerId);

    // Delete player data
    const playerDeleted = await redis.del(`player:${playerId}`);

    // Return true if any records were removed
    return (allRemoved + dailyRemoved + weeklyRemoved + playerDeleted) > 0;
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
  getCurrentTimeKeys
};
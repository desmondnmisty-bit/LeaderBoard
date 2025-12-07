const Redis = require('ioredis');
const { getIO } = require('./socketManager');
const { getPlayerRank } = require('../utils/leaderboard');
const logger = require('../utils/logger');

let subscriber;
let subscriberConnected = false;

const initializePubSub = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  logger.info(`Initializing Redis pub/sub subscriber at: ${redisUrl}`);
  
  subscriber = new Redis(redisUrl, {
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: false,
    retryStrategy: (times) => {
      const delay = Math.min(times * 500, 5000);
      logger.warn(`Redis pub/sub connection attempt ${times}, retrying in ${delay}ms...`);
      return delay;
    },
  });

  subscriber.on('connect', () => {
    subscriberConnected = true;
  });

  subscriber.on('ready', () => {
    subscriberConnected = true;
  });

  subscriber.on('error', (error) => {
    logger.error('Redis subscriber error:', error.message);
    subscriberConnected = false;
  });

  subscriber.on('close', () => {
    subscriberConnected = false;
  });

  subscriber.subscribe('score-update', (err) => {
    if (err) {
      logger.error('Failed to subscribe to score-update channel:', err.message);
    }
  });

  subscriber.on('message', async (channel, message) => {
    if (channel === 'score-update') {
      try {
        const { playerId, playerName, score, timeRange } = JSON.parse(message);

        // Get updated ranks for all time ranges
        const ranks = {};
        const timeRanges = ['all', 'daily', 'weekly'];
        for (const range of timeRanges) {
          const rankData = await getPlayerRank(playerId, range);
          ranks[range] = rankData ? rankData.rank : null;
        }

        // Emit to player's room
        getIO().to(`player:${playerId}`).emit('player-update', {
          playerId,
          playerName,
          score,
          ranks,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('Error processing score-update message:', error);
      }
    }
  });
};

const closePubSub = async () => {
  if (subscriber && subscriberConnected) {
    try {
      await subscriber.quit();
      logger.info('Redis subscriber closed');
    } catch (error) {
      // Suppress error if connection already closed
      if (error.message !== 'Connection is closed.') {
        logger.error('Error closing Redis subscriber:', error.message);
      }
    }
  }
};

module.exports = {
  initializePubSub,
  closePubSub
};
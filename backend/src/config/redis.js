const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis;
let isConnected = false;

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
logger.info(`Connecting to Redis at: ${redisUrl}`);

redis = new Redis(redisUrl, {
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: false,
  connectTimeout: 10000,
  // Keep retrying - Redis is required
  retryStrategy: (times) => {
    const delay = Math.min(times * 500, 5000);
    logger.warn(`Redis connection attempt ${times}, retrying in ${delay}ms...`);
    return delay;
  },
});

redis.on('connect', () => {
  logger.info('Redis client connected');
  isConnected = true;
});

redis.on('ready', () => {
  logger.info('Redis client ready');
  isConnected = true;
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
  isConnected = false;
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
  isConnected = false;
});

process.on('SIGTERM', async () => {
  if (redis && isConnected) {
    logger.info('Closing Redis connection...');
    try {
      await redis.quit();
    } catch (error) {
      // Suppress error if connection already closed
      if (error.message !== 'Connection is closed.') {
        logger.error('Error closing Redis connection:', error);
      }
    }
  }
});

process.on('SIGINT', async () => {
  if (redis && isConnected) {
    logger.info('Closing Redis connection...');
    try {
      await redis.quit();
    } catch (error) {
      // Suppress error if connection already closed
      if (error.message !== 'Connection is closed.') {
        logger.error('Error closing Redis connection:', error);
      }
    }
  }
});

const healthCheck = async () => {
  if (!redis || !isConnected) {
    return { connected: false, responseTime: 0 };
  }
  const start = Date.now();
  try {
    await redis.ping();
    return { connected: true, responseTime: Date.now() - start };
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return { connected: false, responseTime: 0, error: error.message };
  }
};

module.exports = { redis, healthCheck, isConnected };
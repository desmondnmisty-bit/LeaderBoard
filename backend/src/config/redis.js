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
  // Retry logic with exponential backoff
  retryStrategy: (times) => {
    // Max 10 attempts in specification, but we'll keep retrying indefinitely with backoff
    // to match the requirement "Continue attempting reconnection in background"
    const delay = Math.min(times * 1000, 30000);
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

redis.on('reconnecting', (time) => {
  logger.warn(`Redis client reconnecting in ${time}ms...`);
  isConnected = false;
});

redis.on('end', () => {
  logger.error('Redis connection ended permanently');
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
const Redis = require('ioredis');

let redis;
let isConnected = false;

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
console.log(`Connecting to Redis at: ${redisUrl}`);

redis = new Redis(redisUrl, {
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: false,
  connectTimeout: 10000,
  // Keep retrying - Redis is required
  retryStrategy: (times) => {
    const delay = Math.min(times * 500, 5000);
    console.log(`Redis connection attempt ${times}, retrying in ${delay}ms...`);
    return delay;
  },
});

redis.on('connect', () => {
  console.log('Redis client connected');
  isConnected = true;
});

redis.on('ready', () => {
  console.log('Redis client ready');
  isConnected = true;
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err.message);
  isConnected = false;
});

redis.on('close', () => {
  console.log('Redis connection closed');
  isConnected = false;
});

process.on('SIGTERM', async () => {
  if (redis && isConnected) {
    console.log('Closing Redis connection...');
    try {
      await redis.quit();
    } catch (error) {
      // Suppress error if connection already closed
      if (error.message !== 'Connection is closed.') {
        console.error('Error closing Redis connection:', error.message);
      }
    }
  }
});

process.on('SIGINT', async () => {
  if (redis && isConnected) {
    console.log('Closing Redis connection...');
    try {
      await redis.quit();
    } catch (error) {
      // Suppress error if connection already closed
      if (error.message !== 'Connection is closed.') {
        console.error('Error closing Redis connection:', error.message);
      }
    }
  }
});

const healthCheck = async () => {
  if (!redis || !isConnected) {
    return 'disconnected';
  }
  try {
    await redis.ping();
    return 'connected';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return 'disconnected';
  }
};

module.exports = { redis, healthCheck, isConnected };
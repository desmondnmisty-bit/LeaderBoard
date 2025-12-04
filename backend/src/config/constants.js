// Leaderboard Configuration Constants
module.exports = {
  // Score constraints
  DEFAULT_MIN_SCORE: 0,
  DEFAULT_MAX_SCORE: 1000000,
  
  // Pagination
  DEFAULT_PAGE_LIMIT: 100,
  MAX_PAGE_LIMIT: 1000,
  DEFAULT_PLAYERS_AROUND_RANGE: 5,
  MAX_PLAYERS_AROUND_RANGE: 100,
  
  // Time-based leaderboards
  DAILY_TTL_SECONDS: 24 * 60 * 60, // 24 hours
  WEEKLY_TTL_SECONDS: 7 * 24 * 60 * 60, // 7 days
  PLAYER_DATA_TTL_SECONDS: 30 * 24 * 60 * 60, // 30 days
  
  // Real-time updates
  DEFAULT_UPDATE_INTERVAL_MS: 30000, // 30 seconds
  DEFAULT_LIVE_UPDATE_TOP_COUNT: 10,
  
  // Demo mode
  DEFAULT_DEMO_INTERVAL_MS: 10000, // 10 seconds
  DEMO_PLAYER_COUNT: 5,
  DEMO_FAKE_DATA_COUNT: 50,
  
  // Validation
  MAX_PLAYER_ID_LENGTH: 50,
  MIN_PLAYER_ID_LENGTH: 1,
  MAX_PLAYER_NAME_LENGTH: 50,
  MIN_PLAYER_NAME_LENGTH: 1,
  
  // Metadata limits
  MAX_METADATA_KEYS: 50,
  MAX_METADATA_KEY_LENGTH: 100,
  MAX_METADATA_STRING_LENGTH: 1000,
  MAX_METADATA_ARRAY_LENGTH: 100,
  MAX_METADATA_DEPTH: 3,
  
  // Rate limiting
  DEFAULT_RATE_LIMIT_SCORE_WINDOW_MS: 60 * 1000, // 1 minute
  DEFAULT_RATE_LIMIT_SCORE_MAX: 10,
  DEFAULT_RATE_LIMIT_API_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_RATE_LIMIT_API_MAX: 100,
  
  // Redis
  REDIS_RETRY_DELAY_MS: 100,
  REDIS_MAX_RETRIES: 3,
  REDIS_CONNECT_TIMEOUT_MS: 5000,
  
  // Request body
  MAX_REQUEST_BODY_SIZE: '1mb',
  
  // Time ranges
  TIME_RANGES: ['all', 'daily', 'weekly'],
  
  // Redis key prefixes
  LEADERBOARD_KEY_PREFIX: 'leaderboard',
  PLAYER_KEY_PREFIX: 'player',
  
  // Seed data
  SEED_PLAYER_COUNT: 75,
};

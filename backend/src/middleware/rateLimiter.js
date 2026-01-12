const rateLimit = require('express-rate-limit');

// Skip rate limiting if disabled
const skipRateLimiting = () => process.env.RATE_LIMIT_ENABLED === 'false';

// Rate limiter for score submissions
const scoreSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_SCORE) || 10, // 10 requests per minute per IP
  message: {
    success: false,
    error: {
      message: 'Too many score submissions. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimiting
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_API) || 1000, // 1000 requests per 15 minutes per IP (dev-friendly)
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 900
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimiting
});

// Leaderboard read limiter (100 requests per minute)
const leaderboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: {
      message: 'Too many leaderboard requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimiting
});

// Player query limiter (50 requests per minute)
const playerLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,
  message: {
    success: false,
    error: {
      message: 'Too many player requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimiting
});

// Admin operation limiter (20 requests per minute)
const adminLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: {
    success: false,
    error: {
      message: 'Too many admin requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipRateLimiting
});

module.exports = {
  scoreSubmissionLimiter,
  apiLimiter,
  leaderboardLimiter,
  playerLimiter,
  adminLimiter
};

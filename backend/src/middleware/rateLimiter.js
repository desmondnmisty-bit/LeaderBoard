const rateLimit = require('express-rate-limit');

// Rate limiter for score submissions
const scoreSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_SCORE) || 10, // 10 requests per minute per IP
  message: {
    success: false,
    error: {
      message: 'Too many score submissions. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting if disabled
  skip: () => process.env.RATE_LIMIT_ENABLED === 'false'
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_API) || 100, // 100 requests per 15 minutes per IP
  message: {
    success: false,
    error: {
      message: 'Too many requests. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.RATE_LIMIT_ENABLED === 'false'
});

module.exports = {
  scoreSubmissionLimiter,
  apiLimiter
};

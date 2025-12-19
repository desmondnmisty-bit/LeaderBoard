const Sentry = require('@sentry/node');

const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] ${req.method} ${req.path} - Error:`, err);

  // Capture exception in Sentry
  Sentry.captureException(err);

  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';
  let details = null;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
    code = 'VALIDATION_ERROR';
  } else if (err.message && err.message.includes('Redis')) {
    statusCode = 503;
    message = 'Redis service unavailable';
    code = 'REDIS_ERROR';
  } else if (err.statusCode) {
    statusCode = err.statusCode;
  }

  if (process.env.NODE_ENV !== 'production') {
    details = {
      stack: err.stack,
      message: err.message
    };
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details
    }
  });
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};
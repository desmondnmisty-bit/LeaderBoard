/**
 * Admin Authentication Middleware
 * Validates admin API key from request headers
 */

const logger = require('../utils/logger');

const adminAuth = (req, res, next) => {
  const adminApiKey = process.env.ADMIN_API_KEY;
  const ip = req.ip || req.connection.remoteAddress;

  // If no admin key is configured, allow access (development mode)
  if (!adminApiKey) {
    if (process.env.NODE_ENV === 'production') {
      logger.warn(`[ADMIN] Unprotected admin access attempt from ${ip} (ADMIN_API_KEY not set)`);
    }
    return next();
  }

  const providedKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!providedKey) {
    logger.warn(`[ADMIN] Auth failed: Missing key from ${ip} for ${req.method} ${req.originalUrl}`);
    return res.status(401).json({
      success: false,
      error: { message: 'Admin API key required', code: 401 }
    });
  }

  if (providedKey !== adminApiKey) {
    logger.warn(`[ADMIN] Auth failed: Invalid key from ${ip} for ${req.method} ${req.originalUrl}`);
    return res.status(403).json({
      success: false,
      error: { message: 'Invalid admin API key', code: 403 }
    });
  }

  // Log successful admin access
  logger.info(`[ADMIN] Success: ${req.method} ${req.originalUrl} by ${ip}`);

  next();
};

module.exports = { adminAuth };

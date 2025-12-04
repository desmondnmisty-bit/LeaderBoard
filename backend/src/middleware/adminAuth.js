/**
 * Admin Authentication Middleware
 * Validates admin API key from request headers
 */

const adminAuth = (req, res, next) => {
  const adminApiKey = process.env.ADMIN_API_KEY;
  
  // If no admin key is configured, allow access (development mode)
  if (!adminApiKey) {
    console.warn('Warning: ADMIN_API_KEY not set. Admin endpoints are unprotected.');
    return next();
  }

  const providedKey = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!providedKey) {
    return res.status(401).json({
      success: false,
      error: { message: 'Admin API key required', code: 401 }
    });
  }

  if (providedKey !== adminApiKey) {
    return res.status(403).json({
      success: false,
      error: { message: 'Invalid admin API key', code: 403 }
    });
  }

  next();
};

module.exports = { adminAuth };

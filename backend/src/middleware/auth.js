const optionalAuth = (req, res, next) => {
  const adminApiKey = process.env.ADMIN_API_KEY;

  // If no admin key is set: block in production, allow in development
  if (!adminApiKey) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({
        success: false,
        error: { message: 'Server misconfigured: admin key not set', code: 'ADMIN_KEY_MISSING' }
      });
    }
    return next();
  }

  // Check for Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === adminApiKey) {
      return next();
    }
  }

  // Check for x-api-key header
  const apiKey = req.headers['x-api-key'] || req.headers['x-admin-key'];
  if (apiKey === adminApiKey) {
    return next();
  }

  // If admin key is required but not provided or invalid
  return res.status(401).json({
    success: false,
    error: {
      message: 'Authentication required for admin operations',
      code: 'AUTH_REQUIRED'
    }
  });
};

module.exports = { optionalAuth };
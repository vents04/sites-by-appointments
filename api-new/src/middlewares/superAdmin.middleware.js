/**
 * Super Admin Authentication Middleware
 */

const config = require('../config');
const { UnauthorizedError } = require('../utils/errors');

/**
 * Authenticate super admin API key
 */
const authenticateSuperAdmin = (req, res, next) => {
  try {
    const apiKey = req.headers['x-super-admin-key'];
    
    if (!apiKey) {
      throw new UnauthorizedError('UNAUTHORIZED', 'Super admin key required');
    }
    
    if (apiKey !== config.superAdminKey) {
      throw new UnauthorizedError('UNAUTHORIZED', 'Invalid super admin key');
    }
    
    req.isSuperAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticateSuperAdmin
};

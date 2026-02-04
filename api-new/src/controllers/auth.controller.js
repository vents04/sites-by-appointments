/**
 * Auth Controller
 */

const authService = require('../services/auth.service');

/**
 * POST /auth/login
 * Login with business code and password
 */
const login = async (req, res, next) => {
  try {
    const { code, password } = req.body;
    
    const metadata = {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      deviceId: req.headers['x-device-id'],
      platform: req.headers['x-platform'] || 'unknown'
    };
    
    const result = await authService.login(code, password, metadata);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/refresh
 * Refresh JWT token
 */
const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.token);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /auth/logout
 * Logout and invalidate token
 */
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.token);
    
    res.json({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /auth/password
 * Change admin password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    await authService.changePassword(req.businessId, currentPassword, newPassword);
    
    res.json({
      success: true,
      data: {
        message: 'Password updated successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /auth/sessions
 * Get active sessions for the business
 */
const getSessions = async (req, res, next) => {
  try {
    const sessions = await authService.getActiveSessions(req.businessId);
    
    res.json({
      success: true,
      data: sessions.map(session => ({
        id: session._id,
        platform: session.platform,
        lastActivityAt: session.lastActivityAt,
        createdAt: session.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  refresh,
  logout,
  changePassword,
  getSessions
};

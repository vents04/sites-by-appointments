/**
 * Auth Routes
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateBody } = require('../middlewares/validation.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');
const { loginSchema, changePasswordSchema } = require('../validators/auth.validator');

/**
 * POST /auth/login
 * Login with business code and password
 */
router.post('/login', 
  authLimiter,
  validateBody(loginSchema),
  authController.login
);

/**
 * POST /auth/refresh
 * Refresh JWT token
 */
router.post('/refresh',
  authenticate,
  authController.refresh
);

/**
 * POST /auth/logout
 * Logout and invalidate token
 */
router.post('/logout',
  authenticate,
  authController.logout
);

/**
 * PUT /auth/password
 * Change admin password
 */
router.put('/password',
  authenticate,
  validateBody(changePasswordSchema),
  authController.changePassword
);

/**
 * GET /auth/sessions
 * Get active sessions
 */
router.get('/sessions',
  authenticate,
  authController.getSessions
);

module.exports = router;

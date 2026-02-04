/**
 * Super Admin Routes
 * All routes require x-super-admin-key header
 */

const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const { authenticateSuperAdmin } = require('../middlewares/superAdmin.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation.middleware');
const { adminLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  createBusinessSchema,
  updateBusinessSchema,
  resetPasswordSchema,
  listBusinessesQuerySchema,
  idParamsSchema
} = require('../validators/admin.validator');

// Apply super admin authentication to all routes
router.use(authenticateSuperAdmin);
router.use(adminLimiter);

// ============================================
// Platform Stats
// ============================================

/**
 * GET /admin/stats
 * Get platform-wide statistics
 */
router.get('/stats', adminController.getPlatformStats);

// ============================================
// Business Management
// ============================================

/**
 * GET /admin/businesses
 * List all businesses
 */
router.get('/businesses',
  validateQuery(listBusinessesQuerySchema),
  adminController.listBusinesses
);

/**
 * GET /admin/businesses/:id
 * Get single business
 */
router.get('/businesses/:id',
  validateParams(idParamsSchema),
  adminController.getBusiness
);

/**
 * POST /admin/businesses
 * Create new business
 */
router.post('/businesses',
  validateBody(createBusinessSchema),
  adminController.createBusiness
);

/**
 * PUT /admin/businesses/:id
 * Update business
 */
router.put('/businesses/:id',
  validateParams(idParamsSchema),
  validateBody(updateBusinessSchema),
  adminController.updateBusiness
);

/**
 * DELETE /admin/businesses/:id
 * Delete business
 */
router.delete('/businesses/:id',
  validateParams(idParamsSchema),
  adminController.deleteBusiness
);

/**
 * POST /admin/businesses/:id/reset-password
 * Reset admin password
 */
router.post('/businesses/:id/reset-password',
  validateParams(idParamsSchema),
  validateBody(resetPasswordSchema),
  adminController.resetPassword
);

/**
 * POST /admin/businesses/:id/suspend
 * Suspend a business
 */
router.post('/businesses/:id/suspend',
  validateParams(idParamsSchema),
  adminController.suspendBusiness
);

/**
 * POST /admin/businesses/:id/activate
 * Reactivate a business
 */
router.post('/businesses/:id/activate',
  validateParams(idParamsSchema),
  adminController.activateBusiness
);

module.exports = router;

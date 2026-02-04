/**
 * Public Routes
 * No authentication required
 */

const express = require('express');
const router = express.Router();

const publicController = require('../controllers/public.controller');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation.middleware');
const { bookingLimiter } = require('../middlewares/rateLimiter.middleware');
const { 
  createBookingSchema, 
  cancelBookingSchema,
  availabilityQuerySchema 
} = require('../validators/event.validator');
const { z } = require('zod');

// Param schemas
const codeParamsSchema = z.object({
  code: z.string().min(3).max(20)
});

const businessIdParamsSchema = z.object({
  businessId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid business ID')
});

const bookingIdParamsSchema = z.object({
  bookingId: z.string().min(1)
});

// ============================================
// Business Lookup & Info
// ============================================

/**
 * GET /businesses/lookup/:code
 * Lookup a business by its unique code
 */
router.get('/businesses/lookup/:code',
  validateParams(codeParamsSchema),
  publicController.lookupBusiness
);

/**
 * GET /businesses/:businessId/services
 * List all active services for a business
 */
router.get('/businesses/:businessId/services',
  validateParams(businessIdParamsSchema),
  publicController.getBusinessServices
);

/**
 * GET /businesses/:businessId/locations
 * List all locations with their employees
 */
router.get('/businesses/:businessId/locations',
  validateParams(businessIdParamsSchema),
  publicController.getBusinessLocations
);

/**
 * GET /businesses/:businessId/employees
 * List all active employees with their services
 */
router.get('/businesses/:businessId/employees',
  validateParams(businessIdParamsSchema),
  publicController.getBusinessEmployees
);

/**
 * GET /businesses/:businessId/availability
 * Get available time slots for booking
 */
router.get('/businesses/:businessId/availability',
  validateParams(businessIdParamsSchema),
  validateQuery(availabilityQuerySchema),
  publicController.getAvailability
);

// ============================================
// Bookings
// ============================================

/**
 * POST /bookings
 * Create a new booking
 */
router.post('/bookings',
  bookingLimiter,
  validateBody(createBookingSchema),
  publicController.createBooking
);

/**
 * GET /bookings/:bookingId
 * Get booking details
 */
router.get('/bookings/:bookingId',
  validateParams(bookingIdParamsSchema),
  publicController.getBooking
);

/**
 * DELETE /bookings/:bookingId
 * Cancel a booking
 */
router.delete('/bookings/:bookingId',
  bookingLimiter,
  validateParams(bookingIdParamsSchema),
  validateBody(cancelBookingSchema),
  publicController.cancelBooking
);

module.exports = router;

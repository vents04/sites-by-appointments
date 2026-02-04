/**
 * Business Admin Routes
 * All routes require JWT authentication
 */

const express = require('express');
const router = express.Router();

const businessController = require('../controllers/business.controller');
const eventController = require('../controllers/event.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateBody, validateParams, validateQuery } = require('../middlewares/validation.middleware');
const { businessLimiter } = require('../middlewares/rateLimiter.middleware');
const {
  updateProfileSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  createServiceSchema,
  updateServiceSchema,
  createLocationSchema,
  updateLocationSchema,
  updateCustomerSchema,
  idParamsSchema
} = require('../validators/business.validator');
const {
  createEventSchema,
  updateEventSchema,
  eventQuerySchema
} = require('../validators/event.validator');

// Apply authentication and rate limiting to all routes
router.use(authenticate);
router.use(businessLimiter);

// ============================================
// Business Profile
// ============================================

router.get('/profile', businessController.getProfile);
router.put('/profile', validateBody(updateProfileSchema), businessController.updateProfile);

// ============================================
// Employees
// ============================================

router.get('/employees', businessController.getEmployees);
router.get('/employees/:id', validateParams(idParamsSchema), businessController.getEmployee);
router.post('/employees', validateBody(createEmployeeSchema), businessController.createEmployee);
router.put('/employees/:id', validateParams(idParamsSchema), validateBody(updateEmployeeSchema), businessController.updateEmployee);
router.delete('/employees/:id', validateParams(idParamsSchema), businessController.deleteEmployee);

// ============================================
// Services
// ============================================

router.get('/services', businessController.getServices);
router.get('/services/:id', validateParams(idParamsSchema), businessController.getService);
router.post('/services', validateBody(createServiceSchema), businessController.createService);
router.put('/services/:id', validateParams(idParamsSchema), validateBody(updateServiceSchema), businessController.updateService);
router.delete('/services/:id', validateParams(idParamsSchema), businessController.deleteService);

// ============================================
// Locations
// ============================================

router.get('/locations', businessController.getLocations);
router.get('/locations/:id', validateParams(idParamsSchema), businessController.getLocation);
router.post('/locations', validateBody(createLocationSchema), businessController.createLocation);
router.put('/locations/:id', validateParams(idParamsSchema), validateBody(updateLocationSchema), businessController.updateLocation);
router.delete('/locations/:id', validateParams(idParamsSchema), businessController.deleteLocation);

// ============================================
// Events (Calendar)
// ============================================

router.get('/events', validateQuery(eventQuerySchema), eventController.getEvents);
router.get('/events/export', eventController.exportEvents);
router.get('/events/:id', validateParams(idParamsSchema), eventController.getEvent);
router.post('/events', validateBody(createEventSchema), eventController.createEvent);
router.put('/events/:id', validateParams(idParamsSchema), validateBody(updateEventSchema), eventController.updateEvent);
router.delete('/events/:id', validateParams(idParamsSchema), eventController.deleteEvent);

// ============================================
// Bookings
// ============================================

router.get('/bookings', eventController.getBookings);
router.get('/bookings/:id', validateParams(idParamsSchema), eventController.getBooking);
router.put('/bookings/:id', validateParams(idParamsSchema), eventController.updateBookingStatus);

// ============================================
// Customers
// ============================================

router.get('/customers', businessController.getCustomers);
router.get('/customers/:id', validateParams(idParamsSchema), businessController.getCustomer);
router.put('/customers/:id', validateParams(idParamsSchema), validateBody(updateCustomerSchema), businessController.updateCustomer);

module.exports = router;

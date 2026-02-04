/**
 * Public Controller
 * Handles public (non-authenticated) endpoints
 */

const Business = require('../models/Business');
const Service = require('../models/Service');
const Location = require('../models/Location');
const Employee = require('../models/Employee');
const calendarService = require('../services/calendar.service');
const bookingService = require('../services/booking.service');
const { NotFoundError } = require('../utils/errors');

/**
 * GET /businesses/lookup/:code
 * Lookup a business by its unique code
 */
const lookupBusiness = async (req, res, next) => {
  try {
    const { code } = req.params;
    
    const business = await Business.findActiveByCode(code);
    
    if (!business) {
      throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    res.json({
      success: true,
      data: {
        id: business._id,
        code: business.code,
        name: business.name,
        description: business.description,
        logo: business.logo,
        phone: business.phone,
        email: business.email,
        website: business.website,
        socialMedia: business.socialMedia,
        defaultLanguage: business.defaultLanguage,
        currency: business.currency,
        timezone: business.timezone
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /businesses/:businessId/services
 * List all active services for a business
 */
const getBusinessServices = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { category } = req.query;
    
    // Verify business exists and is active
    const business = await Business.findOne({
      _id: businessId,
      status: 'active'
    });
    
    if (!business) {
      throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    let services;
    if (category) {
      services = await Service.findByCategory(businessId, category);
    } else {
      services = await Service.findByBusiness(businessId);
    }
    
    // Get categories for grouping
    const categories = await Service.getCategories(businessId);
    
    res.json({
      success: true,
      data: services.map(s => ({
        id: s._id,
        name: s.name,
        description: s.description,
        price: s.price,
        currency: s.currency,
        duration: s.duration,
        category: s.category,
        image: s.image
      })),
      categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /businesses/:businessId/locations
 * List all locations with their employees
 */
const getBusinessLocations = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    
    // Verify business exists and is active
    const business = await Business.findOne({
      _id: businessId,
      status: 'active'
    });
    
    if (!business) {
      throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    const locations = await Location.findByBusiness(businessId);
    
    // Populate employees
    const populatedLocations = await Location.populate(locations, {
      path: 'employees',
      select: 'name avatar color services',
      match: { status: 'active' }
    });
    
    res.json({
      success: true,
      data: populatedLocations.map(loc => ({
        id: loc._id,
        name: loc.name,
        address: loc.address,
        coordinates: loc.coordinates,
        phone: loc.phone,
        workingHours: loc.workingHours,
        isPrimary: loc.isPrimary,
        employees: loc.employees.map(emp => ({
          id: emp._id,
          name: emp.name,
          avatar: emp.avatar,
          color: emp.color,
          services: emp.services
        }))
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /businesses/:businessId/employees
 * List all active employees with their services
 */
const getBusinessEmployees = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { serviceId } = req.query;
    
    // Verify business exists and is active
    const business = await Business.findOne({
      _id: businessId,
      status: 'active'
    });
    
    if (!business) {
      throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    let employees;
    if (serviceId) {
      employees = await Employee.findByService(businessId, serviceId);
    } else {
      employees = await Employee.findByBusiness(businessId);
    }
    
    // Populate services
    const populatedEmployees = await Employee.populate(employees, {
      path: 'services',
      select: 'name duration price',
      match: { status: 'active' }
    });
    
    res.json({
      success: true,
      data: populatedEmployees.map(emp => ({
        id: emp._id,
        name: emp.name,
        avatar: emp.avatar,
        color: emp.color,
        bio: emp.bio,
        services: emp.services.map(s => ({
          id: s._id,
          name: s.name
        }))
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /businesses/:businessId/availability
 * Get available time slots for booking
 */
const getAvailability = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { serviceId, employeeId, locationId, date, days } = req.query;
    
    if (!serviceId) {
      throw new NotFoundError('VALIDATION_ERROR', 'Service ID is required');
    }
    
    const result = await calendarService.getAvailableSlots(businessId, {
      serviceId,
      employeeId,
      locationId,
      startDate: date ? new Date(date) : undefined,
      days: parseInt(days, 10) || 7
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /bookings
 * Create a new booking (customer-initiated)
 */
const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking({
      ...req.body,
      createdBy: 'customer'
    });
    
    // Broadcast via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.body.businessId}`).emit('event_created', { event: booking });
    }
    
    // TODO: Send confirmation email
    
    res.status(201).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /bookings/:bookingId
 * Get booking details
 */
const getBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    
    // Try to find by ID first, then by UID
    let booking;
    try {
      booking = await bookingService.getBookingById(bookingId);
    } catch (error) {
      if (error.code === 'BOOKING_NOT_FOUND') {
        booking = await bookingService.getBookingByUID(bookingId);
      } else {
        throw error;
      }
    }
    
    res.json({
      success: true,
      data: {
        id: booking._id,
        uid: booking.uid,
        status: booking.status,
        service: booking.serviceSnapshot || {
          name: booking.serviceId?.name,
          duration: booking.serviceId?.duration,
          price: booking.serviceId?.price,
          currency: booking.serviceId?.currency
        },
        employee: booking.employeeId ? {
          id: booking.employeeId._id,
          name: booking.employeeId.name
        } : null,
        location: booking.locationId ? {
          name: booking.locationId.name,
          address: booking.locationId.formattedAddress
        } : null,
        startTime: booking.dtstart,
        endTime: booking.dtend,
        business: booking.businessId ? {
          name: booking.businessId.name,
          phone: booking.businessId.phone
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /bookings/:bookingId
 * Cancel a booking (customer-initiated)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { phone, reason } = req.body;
    
    const result = await bookingService.cancelBookingByCustomer(bookingId, phone, reason);
    
    // Broadcast via WebSocket
    // Note: we need to get the business ID from the booking first
    const booking = await bookingService.getBookingById(bookingId);
    const io = req.app.get('io');
    if (io && booking) {
      io.to(`business:${booking.businessId}`).emit('booking_status_changed', { 
        bookingId,
        status: 'cancelled' 
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  lookupBusiness,
  getBusinessServices,
  getBusinessLocations,
  getBusinessEmployees,
  getAvailability,
  createBooking,
  getBooking,
  cancelBooking
};

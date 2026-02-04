/**
 * Booking Service
 * Handles booking creation and management
 */

const Event = require('../models/Event');
const Customer = require('../models/Customer');
const Employee = require('../models/Employee');
const Service = require('../models/Service');
const Business = require('../models/Business');
const Location = require('../models/Location');
const calendarService = require('./calendar.service');
const { NotFoundError, ConflictError, ValidationError, ForbiddenError } = require('../utils/errors');
const { generateUID, generateBookingSummary, generateBookingDescription } = require('../utils/ics.utils');
const { addMinutes, canCancelBooking } = require('../utils/date.utils');
const logger = require('../utils/logger');

/**
 * Create a new booking
 * @param {Object} data - Booking data
 * @returns {Object} Created event
 */
const createBooking = async (data) => {
  const { 
    businessId, 
    serviceId, 
    employeeId, 
    locationId,
    startTime,
    customer: customerData,
    notes,
    createdBy = 'customer'
  } = data;
  
  // Get business
  const business = await Business.findById(businessId);
  if (!business || business.status !== 'active') {
    throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found or inactive');
  }
  
  // Get service
  const service = await Service.findOne({
    _id: serviceId,
    businessId,
    status: 'active'
  });
  
  if (!service) {
    throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
  }
  
  // Get employee
  const employee = await Employee.findOne({
    _id: employeeId,
    businessId,
    status: 'active',
    services: serviceId
  });
  
  if (!employee) {
    throw new NotFoundError('EMPLOYEE_NOT_FOUND', 'Employee not found or cannot provide this service');
  }
  
  // Calculate end time
  const dtstart = new Date(startTime);
  const dtend = addMinutes(dtstart, service.duration + (service.bufferAfter || 0));
  
  // Validate booking time
  const timeValidation = await calendarService.validateBookingTime(businessId, dtstart);
  if (!timeValidation.valid) {
    throw new ConflictError(timeValidation.reason, timeValidation.message);
  }
  
  // Check availability
  const isAvailable = await calendarService.isSlotAvailable(businessId, employeeId, dtstart, dtend);
  if (!isAvailable) {
    throw new ConflictError('SLOT_NOT_AVAILABLE', 'This time slot is no longer available');
  }
  
  // Find or create customer
  const { customer, isNew } = await Customer.findOrCreate(businessId, {
    ...customerData,
    preferredLanguage: customerData.preferredLanguage || business.defaultLanguage
  });
  
  // Check if customer is blocked
  if (customer.status === 'blocked') {
    throw new ForbiddenError('CUSTOMER_BLOCKED', 'Customer is blocked from making bookings');
  }
  
  // Create event
  const event = await Event.create({
    businessId,
    uid: generateUID(),
    type: 'booking',
    employeeId,
    serviceId,
    customerId: customer._id,
    locationId,
    dtstart,
    dtend,
    summary: generateBookingSummary({ service, customer }),
    description: generateBookingDescription({ service, customer, notes }),
    notes,
    status: 'confirmed',
    customerSnapshot: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone
    },
    serviceSnapshot: {
      name: service.name,
      duration: service.duration,
      price: service.price,
      currency: service.currency
    },
    createdBy
  });
  
  // Update customer stats
  await customer.incrementBookings();
  
  logger.info(`Booking ${event._id} created for business ${businessId}`);
  
  // Populate and return
  const populatedEvent = await Event.findById(event._id)
    .populate('employeeId', 'name avatar color')
    .populate('serviceId', 'name duration price currency')
    .populate('locationId', 'name address');
  
  return formatBookingResponse(populatedEvent, business);
};

/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Object} Booking details
 */
const getBookingById = async (bookingId) => {
  const event = await Event.findOne({
    _id: bookingId,
    type: 'booking'
  })
    .populate('businessId', 'name phone email')
    .populate('employeeId', 'name avatar')
    .populate('serviceId', 'name duration price currency')
    .populate('locationId', 'name address');
  
  if (!event) {
    throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
  }
  
  return event;
};

/**
 * Get booking by UID
 * @param {string} uid - Booking UID
 * @returns {Object} Booking details
 */
const getBookingByUID = async (uid) => {
  const event = await Event.findOne({
    uid,
    type: 'booking'
  })
    .populate('businessId', 'name phone email')
    .populate('employeeId', 'name avatar')
    .populate('serviceId', 'name duration price currency')
    .populate('locationId', 'name address');
  
  if (!event) {
    throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
  }
  
  return event;
};

/**
 * Cancel a booking by customer
 * @param {string} bookingId - Booking ID
 * @param {string} phone - Customer phone for verification
 * @param {string} reason - Cancellation reason
 * @returns {Object} Cancelled booking
 */
const cancelBookingByCustomer = async (bookingId, phone, reason) => {
  const event = await Event.findOne({
    _id: bookingId,
    type: 'booking',
    status: { $nin: ['cancelled', 'completed'] }
  }).populate('businessId');
  
  if (!event) {
    throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
  }
  
  // Verify phone matches
  if (event.customerSnapshot?.phone !== phone) {
    throw new ForbiddenError('PHONE_MISMATCH', 'Phone number does not match booking');
  }
  
  // Check if cancellation is allowed
  const minHours = event.businessId?.minHoursBeforeCancellation || 24;
  if (!canCancelBooking(event.dtstart, minHours)) {
    throw new ConflictError(
      'CANCELLATION_TOO_LATE',
      `Bookings must be cancelled at least ${minHours} hours in advance`
    );
  }
  
  // Cancel the booking
  await event.cancel('customer', reason);
  
  // Update customer stats
  if (event.customerId) {
    const customer = await Customer.findById(event.customerId);
    if (customer) {
      await customer.recordCancellation();
    }
  }
  
  logger.info(`Booking ${event._id} cancelled by customer`);
  
  return {
    id: event._id,
    status: 'cancelled',
    message: 'Booking cancelled successfully'
  };
};

/**
 * Cancel a booking by business admin
 * @param {string} businessId - Business ID
 * @param {string} bookingId - Booking ID
 * @param {string} reason - Cancellation reason
 * @returns {Object} Cancelled booking
 */
const cancelBookingByAdmin = async (businessId, bookingId, reason) => {
  const event = await Event.findOne({
    _id: bookingId,
    businessId,
    type: 'booking',
    status: { $nin: ['cancelled', 'completed'] }
  });
  
  if (!event) {
    throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
  }
  
  await event.cancel('business', reason);
  
  logger.info(`Booking ${event._id} cancelled by business admin`);
  
  return event;
};

/**
 * Update booking status
 * @param {string} businessId - Business ID
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @returns {Object} Updated booking
 */
const updateBookingStatus = async (businessId, bookingId, status) => {
  const event = await Event.findOne({
    _id: bookingId,
    businessId,
    type: 'booking'
  });
  
  if (!event) {
    throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
  }
  
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['completed', 'cancelled', 'no_show'],
    'completed': [],
    'cancelled': [],
    'no_show': []
  };
  
  if (!validTransitions[event.status]?.includes(status)) {
    throw new ValidationError(`Cannot transition from ${event.status} to ${status}`);
  }
  
  if (status === 'completed') {
    await event.markCompleted();
    if (event.customerId) {
      const customer = await Customer.findById(event.customerId);
      if (customer) await customer.recordCompletion();
    }
  } else if (status === 'cancelled') {
    await event.cancel('business');
    if (event.customerId) {
      const customer = await Customer.findById(event.customerId);
      if (customer) await customer.recordCancellation();
    }
  } else if (status === 'no_show') {
    await event.markNoShow();
    if (event.customerId) {
      const customer = await Customer.findById(event.customerId);
      if (customer) await customer.recordNoShow();
    }
  } else {
    event.status = status;
    event.sequence += 1;
    await event.save();
  }
  
  logger.info(`Booking ${event._id} status updated to ${status}`);
  
  return event;
};

/**
 * Get bookings for a business with filters
 * @param {string} businessId - Business ID
 * @param {Object} options - Query options
 * @returns {Object} Bookings with pagination
 */
const getBookings = async (businessId, options = {}) => {
  const {
    startDate,
    endDate,
    employeeId,
    status,
    search,
    page = 1,
    limit = 50
  } = options;
  
  const filter = {
    businessId,
    type: 'booking'
  };
  
  if (startDate) {
    filter.dtstart = { $gte: new Date(startDate) };
  }
  
  if (endDate) {
    filter.dtend = { ...filter.dtend, $lte: new Date(endDate) };
  }
  
  if (employeeId) {
    filter.employeeId = employeeId;
  }
  
  if (status) {
    filter.status = status;
  }
  
  if (search) {
    filter.$or = [
      { 'customerSnapshot.name': new RegExp(search, 'i') },
      { 'customerSnapshot.phone': new RegExp(search, 'i') }
    ];
  }
  
  const total = await Event.countDocuments(filter);
  const bookings = await Event.find(filter)
    .sort({ dtstart: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('employeeId', 'name avatar color')
    .populate('serviceId', 'name duration price')
    .populate('customerId', 'name phone email');
  
  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Format booking response
 */
const formatBookingResponse = (event, business) => ({
  id: event._id,
  uid: event.uid,
  status: event.status,
  service: {
    name: event.serviceSnapshot?.name || event.serviceId?.name,
    duration: event.serviceSnapshot?.duration || event.serviceId?.duration,
    price: event.serviceSnapshot?.price || event.serviceId?.price,
    currency: event.serviceSnapshot?.currency || event.serviceId?.currency
  },
  employee: event.employeeId ? {
    id: event.employeeId._id,
    name: event.employeeId.name,
    avatar: event.employeeId.avatar
  } : null,
  location: event.locationId ? {
    name: event.locationId.name,
    address: event.locationId.formattedAddress
  } : null,
  startTime: event.dtstart,
  endTime: event.dtend,
  customer: event.customerSnapshot,
  business: business ? {
    name: business.name,
    phone: business.phone
  } : null
});

module.exports = {
  createBooking,
  getBookingById,
  getBookingByUID,
  cancelBookingByCustomer,
  cancelBookingByAdmin,
  updateBookingStatus,
  getBookings
};

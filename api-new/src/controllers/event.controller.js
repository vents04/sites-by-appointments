/**
 * Event Controller
 * Handles calendar events and bookings
 */

const Event = require('../models/Event');
const Service = require('../models/Service');
const Employee = require('../models/Employee');
const Customer = require('../models/Customer');
const bookingService = require('../services/booking.service');
const calendarService = require('../services/calendar.service');
const { generateICS } = require('../utils/ics.utils');
const { addMinutes } = require('../utils/date.utils');
const { NotFoundError, ValidationError, ConflictError } = require('../utils/errors');

// ============================================
// Events (Calendar)
// ============================================

/**
 * GET /business/events
 * Get events for the business calendar
 */
const getEvents = async (req, res, next) => {
  try {
    const events = await Event.findByBusiness(req.businessId, {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      employeeId: req.query.employeeId,
      status: req.query.status,
      type: req.query.type
    });
    
    const populatedEvents = await Event.populate(events, [
      { path: 'employeeId', select: 'name avatar color' },
      { path: 'serviceId', select: 'name duration price' },
      { path: 'customerId', select: 'name phone email' }
    ]);
    
    res.json({ success: true, data: populatedEvents });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /business/events/:id
 * Get single event
 */
const getEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      businessId: req.businessId
    })
      .populate('employeeId', 'name avatar color')
      .populate('serviceId', 'name duration price')
      .populate('customerId', 'name phone email notes')
      .populate('locationId', 'name address');
    
    if (!event) {
      throw new NotFoundError('EVENT_NOT_FOUND', 'Event not found');
    }
    
    res.json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /business/events
 * Create new event (block, break, or admin-created booking)
 */
const createEvent = async (req, res, next) => {
  try {
    const { 
      type, 
      employeeId, 
      serviceId,
      locationId,
      dtstart, 
      dtend, 
      allDay,
      summary, 
      description,
      notes,
      rrule,
      customer 
    } = req.body;
    
    // Validate employee belongs to business
    const employee = await Employee.findOne({
      _id: employeeId,
      businessId: req.businessId,
      status: 'active'
    });
    
    if (!employee) {
      throw new NotFoundError('EMPLOYEE_NOT_FOUND', 'Employee not found');
    }
    
    // If this is a booking with customer data, use booking service
    if (type === 'booking' && customer) {
      if (!serviceId) {
        throw new ValidationError('Service is required for bookings');
      }
      
      const booking = await bookingService.createBooking({
        businessId: req.businessId,
        serviceId,
        employeeId,
        locationId,
        startTime: dtstart,
        customer,
        notes,
        createdBy: 'admin'
      });
      
      // Broadcast via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.to(`business:${req.businessId}`).emit('event_created', { event: booking });
      }
      
      return res.status(201).json({ success: true, data: booking });
    }
    
    // For blocks/breaks, calculate end time if not provided
    let endTime = dtend;
    if (!endTime && serviceId) {
      const service = await Service.findById(serviceId);
      if (service) {
        endTime = addMinutes(new Date(dtstart), service.duration);
      }
    }
    
    if (!endTime) {
      throw new ValidationError('End time is required for non-booking events');
    }
    
    // Check for conflicts
    const isAvailable = await calendarService.isSlotAvailable(
      req.businessId,
      employeeId,
      new Date(dtstart),
      new Date(endTime)
    );
    
    if (!isAvailable) {
      throw new ConflictError('SLOT_NOT_AVAILABLE', 'This time slot conflicts with an existing event');
    }
    
    // Create the event
    const event = await Event.create({
      businessId: req.businessId,
      type: type || 'block',
      employeeId,
      serviceId,
      locationId,
      dtstart: new Date(dtstart),
      dtend: new Date(endTime),
      allDay,
      summary: summary || (type === 'break' ? 'Break' : 'Blocked'),
      description,
      notes,
      rrule,
      status: 'confirmed',
      createdBy: 'admin'
    });
    
    // Populate and return
    const populatedEvent = await Event.findById(event._id)
      .populate('employeeId', 'name avatar color');
    
    // Broadcast via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.businessId}`).emit('event_created', { event: populatedEvent });
    }
    
    res.status(201).json({ success: true, data: populatedEvent });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /business/events/:id
 * Update event
 */
const updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });
    
    if (!event) {
      throw new NotFoundError('EVENT_NOT_FOUND', 'Event not found');
    }
    
    const { employeeId, dtstart, dtend, summary, description, notes, status } = req.body;
    
    // If changing time or employee, check for conflicts
    if ((dtstart || dtend || employeeId) && event.status !== 'cancelled') {
      const newEmployeeId = employeeId || event.employeeId;
      const newStart = dtstart ? new Date(dtstart) : event.dtstart;
      const newEnd = dtend ? new Date(dtend) : event.dtend;
      
      const isAvailable = await calendarService.isSlotAvailable(
        req.businessId,
        newEmployeeId,
        newStart,
        newEnd,
        event._id
      );
      
      if (!isAvailable) {
        throw new ConflictError('SLOT_NOT_AVAILABLE', 'This time slot conflicts with an existing event');
      }
      
      if (employeeId) event.employeeId = employeeId;
      if (dtstart) event.dtstart = newStart;
      if (dtend) event.dtend = newEnd;
    }
    
    if (summary !== undefined) event.summary = summary;
    if (description !== undefined) event.description = description;
    if (notes !== undefined) event.notes = notes;
    
    if (status && event.type === 'booking') {
      // Use booking service for status changes
      const updatedEvent = await bookingService.updateBookingStatus(
        req.businessId,
        event._id,
        status
      );
      
      // Broadcast via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.to(`business:${req.businessId}`).emit('event_updated', { event: updatedEvent });
      }
      
      return res.json({ success: true, data: updatedEvent });
    }
    
    event.sequence += 1;
    await event.save();
    
    // Populate and return
    const populatedEvent = await Event.findById(event._id)
      .populate('employeeId', 'name avatar color')
      .populate('serviceId', 'name duration price')
      .populate('customerId', 'name phone email');
    
    // Broadcast via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.businessId}`).emit('event_updated', { event: populatedEvent });
    }
    
    res.json({ success: true, data: populatedEvent });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /business/events/:id
 * Delete event
 */
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      businessId: req.businessId
    });
    
    if (!event) {
      throw new NotFoundError('EVENT_NOT_FOUND', 'Event not found');
    }
    
    // For bookings, use cancel instead of delete
    if (event.type === 'booking' && event.status !== 'cancelled') {
      await event.cancel('business', 'Cancelled by admin');
    } else {
      await Event.deleteOne({ _id: event._id });
    }
    
    // Broadcast via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.businessId}`).emit('event_deleted', { eventId: req.params.id });
    }
    
    res.json({ success: true, data: { message: 'Event deleted successfully' } });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /business/events/export
 * Export events as .ics file
 */
const exportEvents = async (req, res, next) => {
  try {
    const events = await Event.findByBusiness(req.businessId, {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      employeeId: req.query.employeeId
    });
    
    const icsContent = generateICS(events, {
      calendarName: req.business?.name || 'Appointments'
    });
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
    res.send(icsContent);
  } catch (error) {
    next(error);
  }
};

// ============================================
// Bookings
// ============================================

/**
 * GET /business/bookings
 * Get bookings with filters
 */
const getBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getBookings(req.businessId, {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      employeeId: req.query.employeeId,
      status: req.query.status,
      search: req.query.search,
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 50, 100)
    });
    
    res.json({
      success: true,
      data: result.bookings,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /business/bookings/:id
 * Get single booking
 */
const getBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    
    // Verify it belongs to this business
    if (booking.businessId.toString() !== req.businessId) {
      throw new NotFoundError('BOOKING_NOT_FOUND', 'Booking not found');
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /business/bookings/:id
 * Update booking status
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const booking = await bookingService.updateBookingStatus(
      req.businessId,
      req.params.id,
      status
    );
    
    // Broadcast via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.businessId}`).emit('booking_status_changed', { 
        booking,
        status 
      });
    }
    
    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Events
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  exportEvents,
  // Bookings
  getBookings,
  getBooking,
  updateBookingStatus
};

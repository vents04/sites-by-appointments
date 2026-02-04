/**
 * Calendar Service
 * Handles availability calculations and time slot management
 */

const Event = require('../models/Event');
const Employee = require('../models/Employee');
const Service = require('../models/Service');
const Location = require('../models/Location');
const Business = require('../models/Business');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');
const { 
  nowUTC, 
  addDays, 
  addMinutes,
  startOfDayInTZ,
  getDayOfWeekInTZ,
  doesOverlap,
  isBookingTimeValid,
  generateDaySlots
} = require('../utils/date.utils');
const logger = require('../utils/logger');

/**
 * Get available time slots for a service/employee
 * @param {string} businessId - Business ID
 * @param {Object} options - Query options
 * @returns {Object} Available slots grouped by date
 */
const getAvailableSlots = async (businessId, options = {}) => {
  const { 
    serviceId, 
    employeeId, 
    locationId,
    startDate, 
    days = 7 
  } = options;
  
  // Get business configuration
  const business = await Business.findById(businessId);
  if (!business) {
    throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
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
  
  // Get employees who can provide this service
  let employees;
  if (employeeId) {
    const employee = await Employee.findOne({
      _id: employeeId,
      businessId,
      status: 'active',
      services: serviceId
    });
    
    if (!employee) {
      throw new NotFoundError('EMPLOYEE_NOT_FOUND', 'Employee not found or cannot provide this service');
    }
    employees = [employee];
  } else {
    employees = await Employee.find({
      businessId,
      status: 'active',
      services: serviceId
    });
  }
  
  if (employees.length === 0) {
    return { service: formatService(service), slots: [] };
  }
  
  // Get location and working hours
  let location;
  if (locationId) {
    location = await Location.findOne({
      _id: locationId,
      businessId,
      status: 'active'
    });
  } else {
    // Get primary location or first active location
    location = await Location.findOne({
      businessId,
      status: 'active'
    }).sort({ isPrimary: -1 });
  }
  
  if (!location || !location.workingHours || location.workingHours.length === 0) {
    return { service: formatService(service), slots: [] };
  }
  
  const timezone = location.timezone || business.timezone;
  const duration = service.duration + (service.bufferAfter || 0);
  const daysToGenerate = Math.min(days, business.maxDaysInAdvance);
  
  // Calculate date range
  const now = nowUTC();
  const start = startDate ? new Date(startDate) : now;
  const end = addDays(start, daysToGenerate);
  
  // Get all events for employees in date range
  const employeeIds = employees.map(e => e._id);
  const events = await Event.find({
    businessId,
    employeeId: { $in: employeeIds },
    status: { $nin: ['cancelled'] },
    dtstart: { $lt: end },
    dtend: { $gt: start }
  });
  
  // Group events by employee
  const eventsByEmployee = {};
  for (const employee of employees) {
    eventsByEmployee[employee._id.toString()] = events.filter(
      e => e.employeeId.toString() === employee._id.toString()
    );
  }
  
  // Generate slots for each day
  const slotsByDate = {};
  
  for (let i = 0; i < daysToGenerate; i++) {
    const currentDate = addDays(start, i);
    const dayOfWeek = getDayOfWeekInTZ(currentDate, timezone);
    const dateKey = currentDate.toISOString().split('T')[0];
    
    // Get working hours for this day
    const dayHours = location.workingHours.find(wh => wh.day === dayOfWeek);
    if (!dayHours || dayHours.isClosed || !dayHours.ranges || dayHours.ranges.length === 0) {
      continue;
    }
    
    // Get start of day in timezone
    const dayStart = startOfDayInTZ(currentDate, timezone);
    
    // Generate potential slots for this day
    const potentialSlots = generateDaySlots(dayStart, dayHours.ranges, duration, timezone);
    
    // Filter slots by availability
    const availableSlots = [];
    
    for (const slot of potentialSlots) {
      // Check if slot is in the future with minimum booking time
      const validityCheck = isBookingTimeValid(
        slot.start,
        business.minHoursBeforeBooking,
        business.maxDaysInAdvance
      );
      
      if (!validityCheck.valid) {
        continue;
      }
      
      // Find employees available for this slot
      const availableEmployees = [];
      
      for (const employee of employees) {
        const employeeEvents = eventsByEmployee[employee._id.toString()] || [];
        
        // Check if slot overlaps with any event
        if (!doesOverlap(slot.start, slot.end, employeeEvents)) {
          availableEmployees.push({
            id: employee._id,
            name: employee.name,
            avatar: employee.avatar,
            color: employee.color
          });
        }
      }
      
      if (availableEmployees.length > 0) {
        availableSlots.push({
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          employees: availableEmployees
        });
      }
    }
    
    if (availableSlots.length > 0) {
      slotsByDate[dateKey] = availableSlots;
    }
  }
  
  // Format response
  const slots = Object.entries(slotsByDate).map(([date, times]) => ({
    date,
    times
  }));
  
  return {
    service: formatService(service),
    slots
  };
};

/**
 * Check if a specific time slot is available
 * @param {string} businessId - Business ID
 * @param {string} employeeId - Employee ID
 * @param {Date} dtstart - Start time
 * @param {Date} dtend - End time
 * @param {string} excludeEventId - Event ID to exclude (for updates)
 * @returns {boolean} True if available
 */
const isSlotAvailable = async (businessId, employeeId, dtstart, dtend, excludeEventId = null) => {
  const overlapping = await Event.findOverlapping(employeeId, dtstart, dtend, excludeEventId);
  return overlapping.length === 0;
};

/**
 * Validate booking time constraints
 * @param {string} businessId - Business ID
 * @param {Date} dtstart - Start time
 * @returns {Object} Validation result
 */
const validateBookingTime = async (businessId, dtstart) => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
  }
  
  return isBookingTimeValid(
    new Date(dtstart),
    business.minHoursBeforeBooking,
    business.maxDaysInAdvance
  );
};

/**
 * Format service for response
 */
const formatService = (service) => ({
  id: service._id,
  name: service.name,
  duration: service.duration,
  price: service.price,
  currency: service.currency
});

module.exports = {
  getAvailableSlots,
  isSlotAvailable,
  validateBookingTime
};

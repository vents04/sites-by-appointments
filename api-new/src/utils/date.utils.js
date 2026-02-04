/**
 * Date Utility Functions
 * All dates are handled in UTC
 */

const { 
  addMinutes, 
  addHours, 
  addDays, 
  startOfDay, 
  endOfDay,
  isBefore,
  isAfter,
  differenceInMinutes,
  differenceInHours,
  parseISO,
  format,
  isValid
} = require('date-fns');

const { formatInTimeZone, toZonedTime, fromZonedTime } = require('date-fns-tz');

/**
 * Get current UTC date
 */
const nowUTC = () => new Date();

/**
 * Convert a local time to UTC
 * @param {Date|string} date - Local date
 * @param {string} timezone - IANA timezone (e.g., 'Europe/Sofia')
 * @returns {Date} UTC date
 */
const toUTC = (date, timezone) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return fromZonedTime(d, timezone);
};

/**
 * Convert UTC to a specific timezone
 * @param {Date|string} date - UTC date
 * @param {string} timezone - IANA timezone
 * @returns {Date} Zoned date
 */
const fromUTC = (date, timezone) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(d, timezone);
};

/**
 * Format date in a specific timezone
 * @param {Date|string} date - UTC date
 * @param {string} timezone - IANA timezone
 * @param {string} formatStr - date-fns format string
 * @returns {string} Formatted date string
 */
const formatInTZ = (date, timezone, formatStr = 'yyyy-MM-dd HH:mm:ss') => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(d, timezone, formatStr);
};

/**
 * Get start of day in a timezone (returns UTC)
 * @param {Date} date - Reference date
 * @param {string} timezone - IANA timezone
 * @returns {Date} Start of day in UTC
 */
const startOfDayInTZ = (date, timezone) => {
  const zonedDate = fromUTC(date, timezone);
  const startOfDayZoned = startOfDay(zonedDate);
  return fromZonedTime(startOfDayZoned, timezone);
};

/**
 * Get end of day in a timezone (returns UTC)
 * @param {Date} date - Reference date
 * @param {string} timezone - IANA timezone
 * @returns {Date} End of day in UTC
 */
const endOfDayInTZ = (date, timezone) => {
  const zonedDate = fromUTC(date, timezone);
  const endOfDayZoned = endOfDay(zonedDate);
  return fromZonedTime(endOfDayZoned, timezone);
};

/**
 * Get day of week in a timezone
 * @param {Date} date - UTC date
 * @param {string} timezone - IANA timezone
 * @returns {string} Day name (lowercase: 'monday', 'tuesday', etc.)
 */
const getDayOfWeekInTZ = (date, timezone) => {
  return formatInTimeZone(date, timezone, 'EEEE').toLowerCase();
};

/**
 * Check if a time slot overlaps with existing events
 * @param {Date} slotStart - Slot start (UTC)
 * @param {Date} slotEnd - Slot end (UTC)
 * @param {Array} events - Array of events with dtstart and dtend
 * @returns {boolean} True if overlaps
 */
const doesOverlap = (slotStart, slotEnd, events) => {
  for (const event of events) {
    const eventStart = new Date(event.dtstart);
    const eventEnd = new Date(event.dtend);
    
    // Check for overlap: slot starts before event ends AND slot ends after event starts
    if (slotStart < eventEnd && slotEnd > eventStart) {
      return true;
    }
  }
  return false;
};

/**
 * Check if booking is within allowed time window
 * @param {Date} bookingStart - Booking start time (UTC)
 * @param {number} minHoursBefore - Minimum hours before booking
 * @param {number} maxDaysInAdvance - Maximum days in advance
 * @returns {{ valid: boolean, reason?: string }}
 */
const isBookingTimeValid = (bookingStart, minHoursBefore = 2, maxDaysInAdvance = 30) => {
  const now = nowUTC();
  const minAllowedTime = addHours(now, minHoursBefore);
  const maxAllowedTime = addDays(now, maxDaysInAdvance);
  
  if (isBefore(bookingStart, minAllowedTime)) {
    return { 
      valid: false, 
      reason: 'TOO_CLOSE_TO_START',
      message: `Booking must be at least ${minHoursBefore} hours in advance`
    };
  }
  
  if (isAfter(bookingStart, maxAllowedTime)) {
    return { 
      valid: false, 
      reason: 'TOO_FAR_IN_ADVANCE',
      message: `Booking cannot be more than ${maxDaysInAdvance} days in advance`
    };
  }
  
  return { valid: true };
};

/**
 * Check if cancellation is allowed (>24h before)
 * @param {Date} bookingStart - Booking start time (UTC)
 * @param {number} minHoursBefore - Minimum hours before for cancellation (default 24)
 * @returns {boolean}
 */
const canCancelBooking = (bookingStart, minHoursBefore = 24) => {
  const now = nowUTC();
  const hoursUntilStart = differenceInHours(new Date(bookingStart), now);
  return hoursUntilStart >= minHoursBefore;
};

/**
 * Parse time string (HH:mm) to hours and minutes
 * @param {string} timeStr - Time string in HH:mm format
 * @returns {{ hours: number, minutes: number }}
 */
const parseTimeString = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Generate time slots for a day
 * @param {Date} date - The day (UTC start of day)
 * @param {Array} workingHours - Array of { open: 'HH:mm', close: 'HH:mm' }
 * @param {number} slotDuration - Slot duration in minutes
 * @param {string} timezone - Business timezone
 * @returns {Array} Array of { start: Date, end: Date }
 */
const generateDaySlots = (date, workingHours, slotDuration, timezone) => {
  const slots = [];
  
  for (const range of workingHours) {
    const openTime = parseTimeString(range.open);
    const closeTime = parseTimeString(range.close);
    
    // Create zoned times
    const zonedDate = fromUTC(date, timezone);
    let currentSlotStart = new Date(zonedDate);
    currentSlotStart.setHours(openTime.hours, openTime.minutes, 0, 0);
    
    const rangeEnd = new Date(zonedDate);
    rangeEnd.setHours(closeTime.hours, closeTime.minutes, 0, 0);
    
    // Convert to UTC
    currentSlotStart = fromZonedTime(currentSlotStart, timezone);
    const rangeEndUTC = fromZonedTime(rangeEnd, timezone);
    
    while (currentSlotStart < rangeEndUTC) {
      const slotEnd = addMinutes(currentSlotStart, slotDuration);
      
      if (slotEnd <= rangeEndUTC) {
        slots.push({
          start: currentSlotStart,
          end: slotEnd
        });
      }
      
      currentSlotStart = slotEnd;
    }
  }
  
  return slots;
};

module.exports = {
  nowUTC,
  toUTC,
  fromUTC,
  formatInTZ,
  startOfDayInTZ,
  endOfDayInTZ,
  getDayOfWeekInTZ,
  doesOverlap,
  isBookingTimeValid,
  canCancelBooking,
  parseTimeString,
  generateDaySlots,
  addMinutes,
  addHours,
  addDays,
  isBefore,
  isAfter,
  differenceInMinutes,
  differenceInHours,
  parseISO,
  format,
  isValid
};

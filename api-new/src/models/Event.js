/**
 * Event Model
 * Core scheduling model, .ics (RFC 5545) compatible
 */

const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const cancellationSchema = new mongoose.Schema({
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['customer', 'business', 'system']
  },
  reason: String
}, { _id: false });

const customerSnapshotSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String
}, { _id: false });

const serviceSnapshotSchema = new mongoose.Schema({
  name: String,
  duration: Number,
  price: Number,
  currency: String
}, { _id: false });

const remindersSchema = new mongoose.Schema({
  emailSent24h: { type: Boolean, default: false },
  emailSent1h: { type: Boolean, default: false },
  pushSent24h: { type: Boolean, default: false },
  pushSent1h: { type: Boolean, default: false }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  // Multi-tenancy
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business ID is required'],
    index: true
  },
  
  // iCalendar UID - globally unique identifier
  uid: {
    type: String,
    required: true,
    unique: true,
    default: () => `${uuidv4()}@sitezup.com`
  },
  
  // Event type
  type: {
    type: String,
    enum: {
      values: ['booking', 'block', 'holiday', 'break', 'other'],
      message: 'Invalid event type'
    },
    default: 'booking'
  },
  
  // References (for bookings)
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: [true, 'Employee ID is required'],
    index: true
  },
  
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
    // Not required - blocks don't have services
  },
  
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
    // Not required - blocks don't have customers
  },
  
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location'
  },
  
  // iCalendar DTSTART/DTEND (stored in UTC)
  dtstart: {
    type: Date,
    required: [true, 'Start time is required'],
    index: true
  },
  
  dtend: {
    type: Date,
    required: [true, 'End time is required']
  },
  
  // All-day event flag
  allDay: {
    type: Boolean,
    default: false
  },
  
  // iCalendar SUMMARY
  summary: {
    type: String,
    trim: true,
    maxlength: [200, 'Summary cannot exceed 200 characters']
  },
  
  // iCalendar DESCRIPTION
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Notes (internal, not exported to .ics)
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // iCalendar RRULE (RFC 5545 recurrence)
  rrule: {
    type: String,
    trim: true
  },
  
  // For recurring events - the original event ID
  recurringEventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  
  // iCalendar SEQUENCE - incremented on each modification
  sequence: {
    type: Number,
    default: 0
  },
  
  // Booking status
  status: {
    type: String,
    enum: {
      values: ['confirmed', 'pending', 'cancelled', 'completed', 'no_show'],
      message: 'Invalid status'
    },
    default: 'confirmed'
  },
  
  // Cancellation info
  cancellation: cancellationSchema,
  
  // Customer info snapshot (for booking events)
  customerSnapshot: customerSnapshotSchema,
  
  // Service info snapshot (for booking events)
  serviceSnapshot: serviceSnapshotSchema,
  
  // Reminder tracking
  reminders: remindersSchema,
  
  // Creation source
  createdBy: {
    type: String,
    enum: {
      values: ['customer', 'admin', 'system'],
      message: 'Invalid creator type'
    },
    default: 'customer'
  }
  
}, { 
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
eventSchema.index({ businessId: 1, dtstart: 1, dtend: 1 });
eventSchema.index({ businessId: 1, employeeId: 1, dtstart: 1 });
eventSchema.index({ businessId: 1, status: 1 });
eventSchema.index({ uid: 1 }, { unique: true });
eventSchema.index({ customerId: 1 });
eventSchema.index({ recurringEventId: 1 });

// Compound index for availability queries
eventSchema.index({ 
  businessId: 1, 
  employeeId: 1, 
  dtstart: 1, 
  dtend: 1, 
  status: 1 
});

// Virtual for ID
eventSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Virtual for duration in minutes
eventSchema.virtual('duration').get(function() {
  return Math.round((this.dtend - this.dtstart) / (1000 * 60));
});

// Instance methods
eventSchema.methods.isBooking = function() {
  return this.type === 'booking';
};

eventSchema.methods.isBlock = function() {
  return this.type === 'block' || this.type === 'break' || this.type === 'holiday';
};

eventSchema.methods.isActive = function() {
  return this.status !== 'cancelled';
};

eventSchema.methods.canBeCancelled = function(minHoursBefore = 24) {
  if (this.status === 'cancelled' || this.status === 'completed') {
    return false;
  }
  const now = new Date();
  const hoursUntilStart = (this.dtstart - now) / (1000 * 60 * 60);
  return hoursUntilStart >= minHoursBefore;
};

eventSchema.methods.cancel = async function(cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy,
    reason
  };
  this.sequence += 1;
  await this.save();
};

eventSchema.methods.markCompleted = async function() {
  this.status = 'completed';
  this.sequence += 1;
  await this.save();
};

eventSchema.methods.markNoShow = async function() {
  this.status = 'no_show';
  this.sequence += 1;
  await this.save();
};

// Static methods
eventSchema.statics.findByBusiness = function(businessId, options = {}) {
  const { startDate, endDate, employeeId, status, type } = options;
  
  const filter = { businessId };
  
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
  } else {
    filter.status = { $ne: 'cancelled' };
  }
  
  if (type) {
    filter.type = type;
  }
  
  return this.find(filter).sort({ dtstart: 1 });
};

eventSchema.statics.findByEmployee = function(employeeId, startDate, endDate) {
  const filter = {
    employeeId,
    status: { $nin: ['cancelled'] },
    dtstart: { $gte: new Date(startDate) },
    dtend: { $lte: new Date(endDate) }
  };
  
  return this.find(filter).sort({ dtstart: 1 });
};

eventSchema.statics.findOverlapping = function(employeeId, dtstart, dtend, excludeEventId = null) {
  const filter = {
    employeeId,
    status: { $nin: ['cancelled'] },
    $or: [
      // New event starts during existing event
      { dtstart: { $lte: dtstart }, dtend: { $gt: dtstart } },
      // New event ends during existing event
      { dtstart: { $lt: dtend }, dtend: { $gte: dtend } },
      // New event completely contains existing event
      { dtstart: { $gte: dtstart }, dtend: { $lte: dtend } }
    ]
  };
  
  if (excludeEventId) {
    filter._id = { $ne: excludeEventId };
  }
  
  return this.find(filter);
};

eventSchema.statics.findByCustomer = function(customerId, options = {}) {
  const { includeCompleted = true, limit = 50 } = options;
  
  const filter = { customerId };
  
  if (!includeCompleted) {
    filter.status = { $nin: ['cancelled', 'completed'] };
  }
  
  return this.find(filter)
    .sort({ dtstart: -1 })
    .limit(limit);
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;

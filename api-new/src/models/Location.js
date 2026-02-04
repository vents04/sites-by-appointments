/**
 * Location Model
 * Represents physical locations of a business
 */

const mongoose = require('mongoose');

const timeRangeSchema = new mongoose.Schema({
  open: {
    type: String,
    required: [true, 'Open time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)']
  },
  close: {
    type: String,
    required: [true, 'Close time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (use HH:mm)']
  }
}, { _id: false });

const workingHoursSchema = new mongoose.Schema({
  day: {
    type: String,
    required: [true, 'Day is required'],
    enum: {
      values: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      message: 'Invalid day'
    }
  },
  // Multiple time ranges per day (e.g., 09:00-12:00, 14:00-18:00)
  ranges: [timeRangeSchema],
  // If empty ranges array or isClosed is true, the business is closed that day
  isClosed: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const addressSchema = new mongoose.Schema({
  street: { type: String, trim: true },
  city: { type: String, trim: true },
  postalCode: { type: String, trim: true },
  country: { type: String, trim: true, default: 'Bulgaria' }
}, { _id: false });

const coordinatesSchema = new mongoose.Schema({
  lat: { 
    type: Number, 
    min: [-90, 'Latitude must be between -90 and 90'],
    max: [90, 'Latitude must be between -90 and 90']
  },
  lng: { 
    type: Number, 
    min: [-180, 'Longitude must be between -180 and 180'],
    max: [180, 'Longitude must be between -180 and 180']
  }
}, { _id: false });

const locationSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business ID is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Location name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  address: addressSchema,
  
  // Geolocation
  coordinates: coordinatesSchema,
  
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  
  // Employees assigned to this location
  employees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  }],
  
  // Working hours per day
  workingHours: [workingHoursSchema],
  
  // Timezone (can differ from business if multi-location)
  timezone: {
    type: String,
    default: 'Europe/Sofia'
  },
  
  // Is this the primary location?
  isPrimary: {
    type: Boolean,
    default: false
  },
  
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'deleted'],
      message: 'Invalid status'
    },
    default: 'active'
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
locationSchema.index({ businessId: 1, status: 1 });
locationSchema.index({ businessId: 1, isPrimary: 1 });

// Virtual for ID
locationSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Virtual for formatted address
locationSchema.virtual('formattedAddress').get(function() {
  if (!this.address) return '';
  const parts = [];
  if (this.address.street) parts.push(this.address.street);
  if (this.address.city) parts.push(this.address.city);
  if (this.address.postalCode) parts.push(this.address.postalCode);
  if (this.address.country) parts.push(this.address.country);
  return parts.join(', ');
});

// Instance methods
locationSchema.methods.isActive = function() {
  return this.status === 'active';
};

locationSchema.methods.getWorkingHoursForDay = function(day) {
  const dayLower = day.toLowerCase();
  const hours = this.workingHours.find(wh => wh.day === dayLower);
  if (!hours || hours.isClosed || !hours.ranges || hours.ranges.length === 0) {
    return null;
  }
  return hours.ranges;
};

locationSchema.methods.isOpenOnDay = function(day) {
  const hours = this.getWorkingHoursForDay(day);
  return hours !== null && hours.length > 0;
};

// Static methods
locationSchema.statics.findByBusiness = function(businessId, includeInactive = false) {
  const filter = { 
    businessId,
    status: includeInactive ? { $ne: 'deleted' } : 'active'
  };
  return this.find(filter).sort({ isPrimary: -1, name: 1 });
};

locationSchema.statics.findPrimary = function(businessId) {
  return this.findOne({
    businessId,
    isPrimary: true,
    status: 'active'
  });
};

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;

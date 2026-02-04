/**
 * Business Model
 * Root entity representing a registered business on the platform
 */

const mongoose = require('mongoose');

const emailConfigSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  senderName: {
    type: String,
    trim: true,
    maxlength: 100
  },
  senderEmail: {
    type: String,
    trim: true,
    lowercase: true
  },
  smtpHost: {
    type: String,
    trim: true
  },
  smtpPort: {
    type: Number,
    default: 465
  },
  smtpUser: {
    type: String,
    trim: true
  },
  smtpPasswordEncrypted: {
    type: String,
    select: false
  }
}, { _id: false });

const socialMediaSchema = new mongoose.Schema({
  facebook: { type: String, trim: true },
  instagram: { type: String, trim: true },
  tiktok: { type: String, trim: true },
  twitter: { type: String, trim: true },
  youtube: { type: String, trim: true }
}, { _id: false });

const businessSchema = new mongoose.Schema({
  // Unique business code for mobile app entry
  code: {
    type: String,
    required: [true, 'Business code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Code must be at least 3 characters'],
    maxlength: [20, 'Code cannot exceed 20 characters'],
    match: [/^[A-Z0-9_-]+$/, 'Code can only contain letters, numbers, underscores, and hyphens']
  },
  
  // Basic info
  name: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  logo: {
    type: String,
    trim: true
  },
  
  phone: {
    type: String,
    trim: true,
    maxlength: 20
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  website: {
    type: String,
    trim: true
  },
  
  socialMedia: socialMediaSchema,
  
  // Authentication - password hash for business admin login
  adminPasswordHash: {
    type: String,
    required: [true, 'Admin password is required'],
    select: false // Never include in queries by default
  },
  
  // Localization
  defaultLanguage: {
    type: String,
    enum: {
      values: ['bg', 'en'],
      message: 'Language must be bg or en'
    },
    default: 'bg'
  },
  
  currency: {
    type: String,
    enum: {
      values: ['EUR', 'BGN', 'USD'],
      message: 'Currency must be EUR, BGN, or USD'
    },
    default: 'EUR'
  },
  
  timezone: {
    type: String,
    required: [true, 'Timezone is required'],
    default: 'Europe/Sofia'
  },
  
  // Booking configuration
  slotDuration: {
    type: Number,
    required: true,
    default: 30,
    min: [5, 'Slot duration must be at least 5 minutes'],
    max: [480, 'Slot duration cannot exceed 480 minutes']
  },
  
  maxDaysInAdvance: {
    type: Number,
    required: true,
    default: 30,
    min: [1, 'Must allow at least 1 day in advance'],
    max: [365, 'Cannot exceed 365 days in advance']
  },
  
  minHoursBeforeBooking: {
    type: Number,
    required: true,
    default: 2,
    min: [0, 'Cannot be negative'],
    max: [168, 'Cannot exceed 168 hours (1 week)']
  },
  
  // Cancellation policy (hours before appointment)
  minHoursBeforeCancellation: {
    type: Number,
    default: 24,
    min: 0,
    max: 168
  },
  
  // Email configuration
  emailConfig: emailConfigSchema,
  
  // Status
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'suspended', 'deleted'],
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
      delete ret.adminPasswordHash;
      return ret;
    }
  }
});

// Indexes
businessSchema.index({ code: 1 }, { unique: true });
businessSchema.index({ status: 1 });
businessSchema.index({ name: 'text' });

// Virtual for ID
businessSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Instance methods
businessSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Static methods
businessSchema.statics.findByCode = function(code) {
  return this.findOne({ 
    code: code.toUpperCase(), 
    status: { $ne: 'deleted' } 
  });
};

businessSchema.statics.findActiveByCode = function(code) {
  return this.findOne({ 
    code: code.toUpperCase(), 
    status: 'active' 
  });
};

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;

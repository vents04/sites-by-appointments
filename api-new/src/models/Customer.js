/**
 * Customer Model
 * Represents customers who book appointments
 */

const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  cancelledBookings: { type: Number, default: 0 },
  noShows: { type: Number, default: 0 },
  lastVisit: Date
}, { _id: false });

const customerSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business ID is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    maxlength: 20
  },
  
  // Language preference
  preferredLanguage: {
    type: String,
    enum: {
      values: ['bg', 'en'],
      message: 'Language must be bg or en'
    },
    default: 'bg'
  },
  
  // Notes from business admin
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Statistics
  stats: statsSchema,
  
  status: {
    type: String,
    enum: {
      values: ['active', 'blocked', 'deleted'],
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
customerSchema.index({ businessId: 1, phone: 1 }, { unique: true });
customerSchema.index({ businessId: 1, email: 1 });
customerSchema.index({ businessId: 1, status: 1 });
customerSchema.index({ businessId: 1, name: 'text' });

// Virtual for ID
customerSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Instance methods
customerSchema.methods.isActive = function() {
  return this.status === 'active';
};

customerSchema.methods.isBlocked = function() {
  return this.status === 'blocked';
};

customerSchema.methods.incrementBookings = async function() {
  this.stats = this.stats || {};
  this.stats.totalBookings = (this.stats.totalBookings || 0) + 1;
  await this.save();
};

customerSchema.methods.recordCompletion = async function() {
  this.stats = this.stats || {};
  this.stats.completedBookings = (this.stats.completedBookings || 0) + 1;
  this.stats.lastVisit = new Date();
  await this.save();
};

customerSchema.methods.recordCancellation = async function() {
  this.stats = this.stats || {};
  this.stats.cancelledBookings = (this.stats.cancelledBookings || 0) + 1;
  await this.save();
};

customerSchema.methods.recordNoShow = async function() {
  this.stats = this.stats || {};
  this.stats.noShows = (this.stats.noShows || 0) + 1;
  await this.save();
};

// Static methods
customerSchema.statics.findByBusiness = function(businessId, options = {}) {
  const { includeBlocked = false, search = null } = options;
  
  const filter = { 
    businessId,
    status: includeBlocked ? { $ne: 'deleted' } : 'active'
  };
  
  if (search) {
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { phone: new RegExp(search, 'i') },
      { email: new RegExp(search, 'i') }
    ];
  }
  
  return this.find(filter).sort({ name: 1 });
};

customerSchema.statics.findByPhone = function(businessId, phone) {
  return this.findOne({
    businessId,
    phone,
    status: { $ne: 'deleted' }
  });
};

customerSchema.statics.findOrCreate = async function(businessId, customerData) {
  const { phone, name, email, preferredLanguage } = customerData;
  
  let customer = await this.findOne({
    businessId,
    phone,
    status: { $ne: 'deleted' }
  });
  
  if (customer) {
    // Update with new data if provided
    if (name) customer.name = name;
    if (email) customer.email = email;
    if (preferredLanguage) customer.preferredLanguage = preferredLanguage;
    await customer.save();
    return { customer, isNew: false };
  }
  
  // Create new customer
  customer = await this.create({
    businessId,
    phone,
    name,
    email,
    preferredLanguage
  });
  
  return { customer, isNew: true };
};

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;

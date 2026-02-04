/**
 * Employee Model
 * Represents staff members who provide services
 */

const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business ID is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Employee name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  // For calendar display
  color: {
    type: String,
    default: '#3498db',
    match: [/^#[0-9A-Fa-f]{6}$/, 'Invalid color format']
  },
  
  avatar: {
    type: String,
    trim: true
  },
  
  // Services this employee can provide
  services: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
  
  // Contact info (optional)
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
  
  // Brief bio or description
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Display order
  sortOrder: {
    type: Number,
    default: 0
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
employeeSchema.index({ businessId: 1, status: 1 });
employeeSchema.index({ businessId: 1, sortOrder: 1 });
employeeSchema.index({ businessId: 1, name: 'text' });

// Virtual for ID
employeeSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Instance methods
employeeSchema.methods.isActive = function() {
  return this.status === 'active';
};

employeeSchema.methods.canProvideService = function(serviceId) {
  return this.services.some(s => s.toString() === serviceId.toString());
};

// Static methods
employeeSchema.statics.findByBusiness = function(businessId, includeInactive = false) {
  const filter = { 
    businessId,
    status: includeInactive ? { $ne: 'deleted' } : 'active'
  };
  return this.find(filter).sort({ sortOrder: 1, name: 1 });
};

employeeSchema.statics.findByService = function(businessId, serviceId) {
  return this.find({
    businessId,
    services: serviceId,
    status: 'active'
  }).sort({ sortOrder: 1, name: 1 });
};

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;

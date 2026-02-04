/**
 * Service Model
 * Represents services offered by a business
 */

const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business ID is required'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Pricing
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  
  currency: {
    type: String,
    enum: {
      values: ['EUR', 'BGN', 'USD'],
      message: 'Currency must be EUR, BGN, or USD'
    },
    default: 'EUR'
  },
  
  // Duration in minutes
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [5, 'Duration must be at least 5 minutes'],
    max: [480, 'Duration cannot exceed 480 minutes']
  },
  
  // Optional: buffer time between appointments
  bufferAfter: {
    type: Number,
    default: 0,
    min: [0, 'Buffer cannot be negative'],
    max: [60, 'Buffer cannot exceed 60 minutes']
  },
  
  // Category for grouping
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot exceed 50 characters']
  },
  
  // Image/icon for the service
  image: {
    type: String,
    trim: true
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
serviceSchema.index({ businessId: 1, status: 1 });
serviceSchema.index({ businessId: 1, category: 1 });
serviceSchema.index({ businessId: 1, sortOrder: 1 });

// Virtual for ID
serviceSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Virtual for total duration (including buffer)
serviceSchema.virtual('totalDuration').get(function() {
  return this.duration + (this.bufferAfter || 0);
});

// Instance methods
serviceSchema.methods.isActive = function() {
  return this.status === 'active';
};

// Static methods
serviceSchema.statics.findByBusiness = function(businessId, includeInactive = false) {
  const filter = { 
    businessId,
    status: includeInactive ? { $ne: 'deleted' } : 'active'
  };
  return this.find(filter).sort({ sortOrder: 1, name: 1 });
};

serviceSchema.statics.findByCategory = function(businessId, category) {
  return this.find({
    businessId,
    category,
    status: 'active'
  }).sort({ sortOrder: 1, name: 1 });
};

serviceSchema.statics.getCategories = function(businessId) {
  return this.distinct('category', {
    businessId,
    status: 'active',
    category: { $ne: null, $ne: '' }
  });
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;

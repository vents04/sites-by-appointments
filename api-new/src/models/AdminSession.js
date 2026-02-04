/**
 * AdminSession Model
 * Tracks active admin sessions for session management
 */

const mongoose = require('mongoose');

const adminSessionSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: [true, 'Business ID is required'],
    index: true
  },
  
  // JWT token ID (jti claim) - for identifying specific tokens
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Token expiration
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Device/client info
  userAgent: String,
  ipAddress: String,
  
  // Device identifier (for push notifications)
  deviceId: String,
  
  // Platform info
  platform: {
    type: String,
    enum: ['ios', 'android', 'web', 'unknown'],
    default: 'unknown'
  },
  
  // Last activity
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  
  // Is this session active?
  isActive: {
    type: Boolean,
    default: true
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

// TTL index - automatically delete expired sessions
adminSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
adminSessionSchema.index({ businessId: 1, isActive: 1 });
adminSessionSchema.index({ tokenId: 1 }, { unique: true });

// Virtual for ID
adminSessionSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Instance methods
adminSessionSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

adminSessionSchema.methods.deactivate = async function() {
  this.isActive = false;
  await this.save();
};

adminSessionSchema.methods.updateActivity = async function() {
  this.lastActivityAt = new Date();
  await this.save();
};

// Static methods
adminSessionSchema.statics.findActiveByBusiness = function(businessId) {
  return this.find({
    businessId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActivityAt: -1 });
};

adminSessionSchema.statics.findByTokenId = function(tokenId) {
  return this.findOne({ tokenId });
};

adminSessionSchema.statics.deactivateAllForBusiness = async function(businessId) {
  return this.updateMany(
    { businessId, isActive: true },
    { isActive: false }
  );
};

adminSessionSchema.statics.deactivateByTokenId = async function(tokenId) {
  return this.updateOne(
    { tokenId },
    { isActive: false }
  );
};

adminSessionSchema.statics.createSession = async function(data) {
  const { businessId, tokenId, expiresAt, userAgent, ipAddress, deviceId, platform } = data;
  
  return this.create({
    businessId,
    tokenId,
    expiresAt,
    userAgent,
    ipAddress,
    deviceId,
    platform
  });
};

adminSessionSchema.statics.cleanupExpired = async function() {
  return this.deleteMany({
    expiresAt: { $lt: new Date() }
  });
};

const AdminSession = mongoose.model('AdminSession', adminSessionSchema);

module.exports = AdminSession;

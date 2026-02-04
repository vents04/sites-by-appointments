/**
 * Super Admin Controller
 * Platform-wide management endpoints
 */

const Business = require('../models/Business');
const Employee = require('../models/Employee');
const Service = require('../models/Service');
const Location = require('../models/Location');
const Event = require('../models/Event');
const Customer = require('../models/Customer');
const AdminSession = require('../models/AdminSession');
const { hashPassword } = require('../utils/crypto.utils');
const { generateBusinessCode } = require('../utils/crypto.utils');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * GET /admin/businesses
 * List all businesses on the platform
 */
const listBusinesses = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: 'deleted' };
    }
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { code: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') }
      ];
    }
    
    const total = await Business.countDocuments(filter);
    const businesses = await Business.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    
    // Get stats for each business
    const businessesWithStats = await Promise.all(businesses.map(async (business) => {
      const [employeeCount, serviceCount, eventCount] = await Promise.all([
        Employee.countDocuments({ businessId: business._id, status: 'active' }),
        Service.countDocuments({ businessId: business._id, status: 'active' }),
        Event.countDocuments({ businessId: business._id, type: 'booking' })
      ]);
      
      return {
        ...business.toJSON(),
        stats: {
          employees: employeeCount,
          services: serviceCount,
          totalBookings: eventCount
        }
      };
    }));
    
    res.json({
      success: true,
      data: businessesWithStats,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/businesses/:id
 * Get single business details
 */
const getBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    // Get detailed stats
    const [employees, services, locations, recentBookings, customerCount] = await Promise.all([
      Employee.find({ businessId: business._id, status: { $ne: 'deleted' } }),
      Service.find({ businessId: business._id, status: { $ne: 'deleted' } }),
      Location.find({ businessId: business._id, status: { $ne: 'deleted' } }),
      Event.find({ businessId: business._id, type: 'booking' })
        .sort({ createdAt: -1 })
        .limit(10),
      Customer.countDocuments({ businessId: business._id, status: 'active' })
    ]);
    
    res.json({
      success: true,
      data: {
        ...business.toJSON(),
        employees,
        services,
        locations,
        recentBookings,
        stats: {
          employees: employees.length,
          services: services.length,
          locations: locations.length,
          customers: customerCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/businesses
 * Create new business
 */
const createBusiness = async (req, res, next) => {
  try {
    const { 
      code, 
      name, 
      adminPassword, 
      phone, 
      email, 
      timezone = 'Europe/Sofia',
      defaultLanguage = 'bg',
      currency = 'EUR'
    } = req.body;
    
    // Generate code if not provided
    let businessCode = code?.toUpperCase();
    if (!businessCode) {
      // Generate unique code
      let attempts = 0;
      while (attempts < 10) {
        businessCode = generateBusinessCode(6);
        const existing = await Business.findOne({ code: businessCode });
        if (!existing) break;
        attempts++;
      }
      
      if (attempts >= 10) {
        throw new ConflictError('CODE_GENERATION_FAILED', 'Failed to generate unique code');
      }
    }
    
    // Check if code already exists
    const existingCode = await Business.findOne({ code: businessCode });
    if (existingCode) {
      throw new ConflictError('DUPLICATE_ENTRY', 'Business code already exists');
    }
    
    // Hash password
    const adminPasswordHash = await hashPassword(adminPassword);
    
    const business = await Business.create({
      code: businessCode,
      name,
      adminPasswordHash,
      phone,
      email,
      timezone,
      defaultLanguage,
      currency,
      status: 'active'
    });
    
    logger.info(`Business ${business.code} created by super admin`);
    
    res.status(201).json({
      success: true,
      data: business
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /admin/businesses/:id
 * Update any business
 */
const updateBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    // Super admin can update all fields including code
    const allowedFields = [
      'name', 'description', 'logo', 'phone', 'email', 'website',
      'socialMedia', 'defaultLanguage', 'currency', 'timezone',
      'slotDuration', 'maxDaysInAdvance', 'minHoursBeforeBooking',
      'minHoursBeforeCancellation', 'emailConfig', 'status'
    ];
    
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        business[field] = req.body[field];
      }
    }
    
    // Special handling for code change
    if (req.body.code && req.body.code.toUpperCase() !== business.code) {
      const existingCode = await Business.findOne({ 
        code: req.body.code.toUpperCase(),
        _id: { $ne: business._id }
      });
      if (existingCode) {
        throw new ConflictError('DUPLICATE_ENTRY', 'Business code already exists');
      }
      business.code = req.body.code.toUpperCase();
    }
    
    await business.save();
    
    logger.info(`Business ${business.code} updated by super admin`);
    
    res.json({
      success: true,
      data: business
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /admin/businesses/:id
 * Soft delete business
 */
const deleteBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    business.status = 'deleted';
    await business.save();
    
    // Invalidate all sessions
    await AdminSession.deactivateAllForBusiness(business._id);
    
    logger.info(`Business ${business.code} deleted by super admin`);
    
    res.json({
      success: true,
      data: { message: 'Business deleted successfully' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/businesses/:id/reset-password
 * Reset admin password
 */
const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    business.adminPasswordHash = await hashPassword(newPassword);
    await business.save();
    
    // Invalidate all sessions
    await AdminSession.deactivateAllForBusiness(business._id);
    
    logger.info(`Password reset for business ${business.code} by super admin`);
    
    res.json({
      success: true,
      data: { message: 'Password reset successfully' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/businesses/:id/suspend
 * Suspend a business
 */
const suspendBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    business.status = 'suspended';
    await business.save();
    
    // Invalidate all sessions
    await AdminSession.deactivateAllForBusiness(business._id);
    
    logger.info(`Business ${business.code} suspended by super admin`);
    
    res.json({
      success: true,
      data: { message: 'Business suspended successfully' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /admin/businesses/:id/activate
 * Reactivate a business
 */
const activateBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    
    if (!business) {
      throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
    }
    
    if (business.status === 'deleted') {
      throw new ValidationError('Cannot reactivate a deleted business');
    }
    
    business.status = 'active';
    await business.save();
    
    logger.info(`Business ${business.code} activated by super admin`);
    
    res.json({
      success: true,
      data: { message: 'Business activated successfully' }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /admin/stats
 * Get platform-wide statistics
 */
const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalBusinesses,
      activeBusinesses,
      totalEmployees,
      totalServices,
      totalBookings,
      totalCustomers
    ] = await Promise.all([
      Business.countDocuments({ status: { $ne: 'deleted' } }),
      Business.countDocuments({ status: 'active' }),
      Employee.countDocuments({ status: 'active' }),
      Service.countDocuments({ status: 'active' }),
      Event.countDocuments({ type: 'booking' }),
      Customer.countDocuments({ status: 'active' })
    ]);
    
    // Get recent activity
    const recentBusinesses = await Business.find({ status: { $ne: 'deleted' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('code name createdAt status');
    
    res.json({
      success: true,
      data: {
        businesses: {
          total: totalBusinesses,
          active: activeBusinesses
        },
        employees: totalEmployees,
        services: totalServices,
        bookings: totalBookings,
        customers: totalCustomers,
        recentBusinesses
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listBusinesses,
  getBusiness,
  createBusiness,
  updateBusiness,
  deleteBusiness,
  resetPassword,
  suspendBusiness,
  activateBusiness,
  getPlatformStats
};

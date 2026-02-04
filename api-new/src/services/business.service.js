/**
 * Business Service
 */

const Business = require('../models/Business');
const Employee = require('../models/Employee');
const Service = require('../models/Service');
const Location = require('../models/Location');
const Customer = require('../models/Customer');
const { NotFoundError, ConflictError, ValidationError } = require('../utils/errors');
const { hashPassword } = require('../utils/crypto.utils');
const logger = require('../utils/logger');

// ============================================
// Business Profile Management
// ============================================

/**
 * Get business profile
 */
const getProfile = async (businessId) => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
  }
  return business;
};

/**
 * Update business profile
 */
const updateProfile = async (businessId, updates) => {
  const business = await Business.findById(businessId);
  if (!business) {
    throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
  }
  
  // Fields that can be updated
  const allowedFields = [
    'name', 'description', 'logo', 'phone', 'email', 'website',
    'socialMedia', 'defaultLanguage', 'currency', 'timezone',
    'slotDuration', 'maxDaysInAdvance', 'minHoursBeforeBooking',
    'minHoursBeforeCancellation', 'emailConfig'
  ];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      business[field] = updates[field];
    }
  }
  
  await business.save();
  logger.info(`Business ${business.code} profile updated`);
  return business;
};

// ============================================
// Employee Management
// ============================================

/**
 * Get all employees for a business
 */
const getEmployees = async (businessId, options = {}) => {
  const { includeInactive = false } = options;
  return Employee.findByBusiness(businessId, includeInactive);
};

/**
 * Get employee by ID
 */
const getEmployee = async (businessId, employeeId) => {
  const employee = await Employee.findOne({
    _id: employeeId,
    businessId,
    status: { $ne: 'deleted' }
  }).populate('services', 'name duration price');
  
  if (!employee) {
    throw new NotFoundError('EMPLOYEE_NOT_FOUND', 'Employee not found');
  }
  return employee;
};

/**
 * Create new employee
 */
const createEmployee = async (businessId, data) => {
  // Validate services exist and belong to business
  if (data.services && data.services.length > 0) {
    const serviceCount = await Service.countDocuments({
      _id: { $in: data.services },
      businessId,
      status: 'active'
    });
    
    if (serviceCount !== data.services.length) {
      throw new ValidationError('Some services are invalid or not active');
    }
  }
  
  const employee = await Employee.create({
    ...data,
    businessId
  });
  
  logger.info(`Employee ${employee.name} created for business ${businessId}`);
  return employee;
};

/**
 * Update employee
 */
const updateEmployee = async (businessId, employeeId, updates) => {
  const employee = await Employee.findOne({
    _id: employeeId,
    businessId,
    status: { $ne: 'deleted' }
  });
  
  if (!employee) {
    throw new NotFoundError('EMPLOYEE_NOT_FOUND', 'Employee not found');
  }
  
  // Validate services if being updated
  if (updates.services && updates.services.length > 0) {
    const serviceCount = await Service.countDocuments({
      _id: { $in: updates.services },
      businessId,
      status: 'active'
    });
    
    if (serviceCount !== updates.services.length) {
      throw new ValidationError('Some services are invalid or not active');
    }
  }
  
  const allowedFields = ['name', 'color', 'avatar', 'services', 'phone', 'email', 'bio', 'sortOrder', 'status'];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      employee[field] = updates[field];
    }
  }
  
  await employee.save();
  logger.info(`Employee ${employee.name} updated`);
  return employee;
};

/**
 * Delete employee (soft delete)
 */
const deleteEmployee = async (businessId, employeeId) => {
  const employee = await Employee.findOne({
    _id: employeeId,
    businessId,
    status: { $ne: 'deleted' }
  });
  
  if (!employee) {
    throw new NotFoundError('EMPLOYEE_NOT_FOUND', 'Employee not found');
  }
  
  employee.status = 'deleted';
  await employee.save();
  
  // Remove from locations
  await Location.updateMany(
    { businessId, employees: employeeId },
    { $pull: { employees: employeeId } }
  );
  
  logger.info(`Employee ${employee.name} deleted`);
  return { message: 'Employee deleted successfully' };
};

// ============================================
// Service Management
// ============================================

/**
 * Get all services for a business
 */
const getServices = async (businessId, options = {}) => {
  const { includeInactive = false, category = null } = options;
  
  if (category) {
    return Service.findByCategory(businessId, category);
  }
  return Service.findByBusiness(businessId, includeInactive);
};

/**
 * Get service by ID
 */
const getService = async (businessId, serviceId) => {
  const service = await Service.findOne({
    _id: serviceId,
    businessId,
    status: { $ne: 'deleted' }
  });
  
  if (!service) {
    throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
  }
  return service;
};

/**
 * Create new service
 */
const createService = async (businessId, data) => {
  const service = await Service.create({
    ...data,
    businessId
  });
  
  logger.info(`Service ${service.name} created for business ${businessId}`);
  return service;
};

/**
 * Update service
 */
const updateService = async (businessId, serviceId, updates) => {
  const service = await Service.findOne({
    _id: serviceId,
    businessId,
    status: { $ne: 'deleted' }
  });
  
  if (!service) {
    throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
  }
  
  const allowedFields = ['name', 'description', 'price', 'currency', 'duration', 'bufferAfter', 'category', 'image', 'sortOrder', 'status'];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      service[field] = updates[field];
    }
  }
  
  await service.save();
  logger.info(`Service ${service.name} updated`);
  return service;
};

/**
 * Delete service (soft delete)
 */
const deleteService = async (businessId, serviceId) => {
  const service = await Service.findOne({
    _id: serviceId,
    businessId,
    status: { $ne: 'deleted' }
  });
  
  if (!service) {
    throw new NotFoundError('SERVICE_NOT_FOUND', 'Service not found');
  }
  
  service.status = 'deleted';
  await service.save();
  
  // Remove from employees
  await Employee.updateMany(
    { businessId, services: serviceId },
    { $pull: { services: serviceId } }
  );
  
  logger.info(`Service ${service.name} deleted`);
  return { message: 'Service deleted successfully' };
};

// ============================================
// Location Management
// ============================================

/**
 * Get all locations for a business
 */
const getLocations = async (businessId, options = {}) => {
  const { includeInactive = false } = options;
  return Location.findByBusiness(businessId, includeInactive);
};

/**
 * Get location by ID
 */
const getLocation = async (businessId, locationId) => {
  const location = await Location.findOne({
    _id: locationId,
    businessId,
    status: { $ne: 'deleted' }
  }).populate('employees', 'name avatar color');
  
  if (!location) {
    throw new NotFoundError('LOCATION_NOT_FOUND', 'Location not found');
  }
  return location;
};

/**
 * Create new location
 */
const createLocation = async (businessId, data) => {
  // Validate employees exist and belong to business
  if (data.employees && data.employees.length > 0) {
    const employeeCount = await Employee.countDocuments({
      _id: { $in: data.employees },
      businessId,
      status: 'active'
    });
    
    if (employeeCount !== data.employees.length) {
      throw new ValidationError('Some employees are invalid or not active');
    }
  }
  
  // If this is marked as primary, unset other primary locations
  if (data.isPrimary) {
    await Location.updateMany(
      { businessId, isPrimary: true },
      { isPrimary: false }
    );
  }
  
  const location = await Location.create({
    ...data,
    businessId
  });
  
  logger.info(`Location ${location.name} created for business ${businessId}`);
  return location;
};

/**
 * Update location
 */
const updateLocation = async (businessId, locationId, updates) => {
  const location = await Location.findOne({
    _id: locationId,
    businessId,
    status: { $ne: 'deleted' }
  });
  
  if (!location) {
    throw new NotFoundError('LOCATION_NOT_FOUND', 'Location not found');
  }
  
  // Validate employees if being updated
  if (updates.employees && updates.employees.length > 0) {
    const employeeCount = await Employee.countDocuments({
      _id: { $in: updates.employees },
      businessId,
      status: 'active'
    });
    
    if (employeeCount !== updates.employees.length) {
      throw new ValidationError('Some employees are invalid or not active');
    }
  }
  
  // If setting as primary, unset other primary locations
  if (updates.isPrimary) {
    await Location.updateMany(
      { businessId, isPrimary: true, _id: { $ne: locationId } },
      { isPrimary: false }
    );
  }
  
  const allowedFields = ['name', 'address', 'coordinates', 'phone', 'employees', 'workingHours', 'timezone', 'isPrimary', 'status'];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      location[field] = updates[field];
    }
  }
  
  await location.save();
  logger.info(`Location ${location.name} updated`);
  return location;
};

/**
 * Delete location (soft delete)
 */
const deleteLocation = async (businessId, locationId) => {
  const location = await Location.findOne({
    _id: locationId,
    businessId,
    status: { $ne: 'deleted' }
  });
  
  if (!location) {
    throw new NotFoundError('LOCATION_NOT_FOUND', 'Location not found');
  }
  
  location.status = 'deleted';
  await location.save();
  
  logger.info(`Location ${location.name} deleted`);
  return { message: 'Location deleted successfully' };
};

// ============================================
// Customer Management
// ============================================

/**
 * Get customers for a business
 */
const getCustomers = async (businessId, options = {}) => {
  const { page = 1, limit = 50, search = null, includeBlocked = false } = options;
  
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
  
  const total = await Customer.countDocuments(filter);
  const customers = await Customer.find(filter)
    .sort({ name: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
  
  return {
    customers,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get customer by ID
 */
const getCustomer = async (businessId, customerId) => {
  const customer = await Customer.findOne({
    _id: customerId,
    businessId,
    status: { $ne: 'deleted' }
  });
  
  if (!customer) {
    throw new NotFoundError('CUSTOMER_NOT_FOUND', 'Customer not found');
  }
  return customer;
};

/**
 * Update customer
 */
const updateCustomer = async (businessId, customerId, updates) => {
  const customer = await Customer.findOne({
    _id: customerId,
    businessId,
    status: { $ne: 'deleted' }
  });
  
  if (!customer) {
    throw new NotFoundError('CUSTOMER_NOT_FOUND', 'Customer not found');
  }
  
  const allowedFields = ['name', 'email', 'preferredLanguage', 'notes', 'status'];
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      customer[field] = updates[field];
    }
  }
  
  await customer.save();
  logger.info(`Customer ${customer.name} updated`);
  return customer;
};

module.exports = {
  // Business
  getProfile,
  updateProfile,
  // Employees
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  // Services
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  // Locations
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  // Customers
  getCustomers,
  getCustomer,
  updateCustomer
};

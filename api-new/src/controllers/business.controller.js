/**
 * Business Admin Controller
 */

const businessService = require('../services/business.service');

// ============================================
// Business Profile
// ============================================

const getProfile = async (req, res, next) => {
  try {
    const business = await businessService.getProfile(req.businessId);
    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const business = await businessService.updateProfile(req.businessId, req.body);
    res.json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Employees
// ============================================

const getEmployees = async (req, res, next) => {
  try {
    const employees = await businessService.getEmployees(req.businessId, {
      includeInactive: req.query.includeInactive === 'true'
    });
    res.json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
};

const getEmployee = async (req, res, next) => {
  try {
    const employee = await businessService.getEmployee(req.businessId, req.params.id);
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const employee = await businessService.createEmployee(req.businessId, req.body);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const employee = await businessService.updateEmployee(req.businessId, req.params.id, req.body);
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

const deleteEmployee = async (req, res, next) => {
  try {
    const result = await businessService.deleteEmployee(req.businessId, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Services
// ============================================

const getServices = async (req, res, next) => {
  try {
    const services = await businessService.getServices(req.businessId, {
      includeInactive: req.query.includeInactive === 'true',
      category: req.query.category
    });
    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
};

const getService = async (req, res, next) => {
  try {
    const service = await businessService.getService(req.businessId, req.params.id);
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const service = await businessService.createService(req.businessId, req.body);
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const service = await businessService.updateService(req.businessId, req.params.id, req.body);
    res.json({ success: true, data: service });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const result = await businessService.deleteService(req.businessId, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Locations
// ============================================

const getLocations = async (req, res, next) => {
  try {
    const locations = await businessService.getLocations(req.businessId, {
      includeInactive: req.query.includeInactive === 'true'
    });
    res.json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
};

const getLocation = async (req, res, next) => {
  try {
    const location = await businessService.getLocation(req.businessId, req.params.id);
    res.json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};

const createLocation = async (req, res, next) => {
  try {
    const location = await businessService.createLocation(req.businessId, req.body);
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};

const updateLocation = async (req, res, next) => {
  try {
    const location = await businessService.updateLocation(req.businessId, req.params.id, req.body);
    res.json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};

const deleteLocation = async (req, res, next) => {
  try {
    const result = await businessService.deleteLocation(req.businessId, req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// ============================================
// Customers
// ============================================

const getCustomers = async (req, res, next) => {
  try {
    const result = await businessService.getCustomers(req.businessId, {
      page: parseInt(req.query.page, 10) || 1,
      limit: Math.min(parseInt(req.query.limit, 10) || 50, 100),
      search: req.query.search,
      includeBlocked: req.query.includeBlocked === 'true'
    });
    res.json({ 
      success: true, 
      data: result.customers,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

const getCustomer = async (req, res, next) => {
  try {
    const customer = await businessService.getCustomer(req.businessId, req.params.id);
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

const updateCustomer = async (req, res, next) => {
  try {
    const customer = await businessService.updateCustomer(req.businessId, req.params.id, req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // Profile
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

/**
 * Jest Test Setup
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Create in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect mongoose
  await mongoose.connect(mongoUri);
  
  // Set test environment variables
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
  process.env.SUPER_ADMIN_KEY = 'test-super-admin-key';
  process.env.NODE_ENV = 'test';
});

// Cleanup after each test
afterEach(async () => {
  // Clear all collections
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Global test helpers
global.testHelpers = {
  /**
   * Create a test business
   */
  createTestBusiness: async (overrides = {}) => {
    const Business = require('../src/models/Business');
    const bcrypt = require('bcrypt');
    
    const passwordHash = await bcrypt.hash('password123', 10);
    
    return Business.create({
      code: 'TEST' + Date.now(),
      name: 'Test Business',
      adminPasswordHash: passwordHash,
      timezone: 'Europe/Sofia',
      defaultLanguage: 'bg',
      currency: 'EUR',
      status: 'active',
      ...overrides
    });
  },
  
  /**
   * Generate a JWT token for a business
   */
  generateTestToken: (businessId) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { businessId: businessId.toString(), type: 'business_admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  },
  
  /**
   * Create a test employee
   */
  createTestEmployee: async (businessId, overrides = {}) => {
    const Employee = require('../src/models/Employee');
    
    return Employee.create({
      businessId,
      name: 'Test Employee',
      color: '#3498db',
      status: 'active',
      ...overrides
    });
  },
  
  /**
   * Create a test service
   */
  createTestService: async (businessId, overrides = {}) => {
    const Service = require('../src/models/Service');
    
    return Service.create({
      businessId,
      name: 'Test Service',
      price: 50,
      currency: 'EUR',
      duration: 60,
      status: 'active',
      ...overrides
    });
  },
  
  /**
   * Create a test location with working hours
   */
  createTestLocation: async (businessId, overrides = {}) => {
    const Location = require('../src/models/Location');
    
    return Location.create({
      businessId,
      name: 'Test Location',
      address: {
        street: '123 Test St',
        city: 'Sofia',
        country: 'Bulgaria'
      },
      phone: '+359888123456',
      workingHours: [
        { day: 'monday', ranges: [{ open: '09:00', close: '18:00' }] },
        { day: 'tuesday', ranges: [{ open: '09:00', close: '18:00' }] },
        { day: 'wednesday', ranges: [{ open: '09:00', close: '18:00' }] },
        { day: 'thursday', ranges: [{ open: '09:00', close: '18:00' }] },
        { day: 'friday', ranges: [{ open: '09:00', close: '18:00' }] }
      ],
      isPrimary: true,
      status: 'active',
      ...overrides
    });
  }
};

/**
 * Public Endpoints Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Public Endpoints', () => {
  let testBusiness;
  let testEmployee;
  let testService;
  let testLocation;
  
  beforeEach(async () => {
    testBusiness = await global.testHelpers.createTestBusiness({
      code: 'PUBTEST'
    });
    
    testService = await global.testHelpers.createTestService(testBusiness._id);
    testEmployee = await global.testHelpers.createTestEmployee(testBusiness._id, {
      services: [testService._id]
    });
    testLocation = await global.testHelpers.createTestLocation(testBusiness._id, {
      employees: [testEmployee._id]
    });
  });
  
  describe('GET /v1/businesses/lookup/:code', () => {
    it('should return business by code', async () => {
      const res = await request(app)
        .get('/v1/businesses/lookup/PUBTEST');
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('PUBTEST');
      expect(res.body.data.name).toBe('Test Business');
      // Should not expose sensitive data
      expect(res.body.data.adminPasswordHash).toBeUndefined();
    });
    
    it('should be case insensitive', async () => {
      const res = await request(app)
        .get('/v1/businesses/lookup/pubtest');
      
      expect(res.status).toBe(200);
      expect(res.body.data.code).toBe('PUBTEST');
    });
    
    it('should return 404 for invalid code', async () => {
      const res = await request(app)
        .get('/v1/businesses/lookup/INVALID');
      
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('BUSINESS_NOT_FOUND');
    });
    
    it('should not return inactive business', async () => {
      testBusiness.status = 'inactive';
      await testBusiness.save();
      
      const res = await request(app)
        .get('/v1/businesses/lookup/PUBTEST');
      
      expect(res.status).toBe(404);
    });
  });
  
  describe('GET /v1/businesses/:businessId/services', () => {
    it('should return services for business', async () => {
      const res = await request(app)
        .get(`/v1/businesses/${testBusiness._id}/services`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Test Service');
      expect(res.body.data[0].price).toBe(50);
    });
    
    it('should not return inactive services', async () => {
      testService.status = 'inactive';
      await testService.save();
      
      const res = await request(app)
        .get(`/v1/businesses/${testBusiness._id}/services`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });
  
  describe('GET /v1/businesses/:businessId/employees', () => {
    it('should return employees for business', async () => {
      const res = await request(app)
        .get(`/v1/businesses/${testBusiness._id}/employees`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Test Employee');
    });
    
    it('should filter by service', async () => {
      const res = await request(app)
        .get(`/v1/businesses/${testBusiness._id}/employees`)
        .query({ serviceId: testService._id.toString() });
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
  
  describe('GET /v1/businesses/:businessId/locations', () => {
    it('should return locations with employees', async () => {
      const res = await request(app)
        .get(`/v1/businesses/${testBusiness._id}/locations`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Test Location');
      expect(res.body.data[0].employees).toHaveLength(1);
    });
  });
  
  describe('GET /v1/businesses/:businessId/availability', () => {
    it('should return available slots', async () => {
      const res = await request(app)
        .get(`/v1/businesses/${testBusiness._id}/availability`)
        .query({ 
          serviceId: testService._id.toString(),
          days: 7
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service).toBeDefined();
      expect(res.body.data.service.name).toBe('Test Service');
      expect(Array.isArray(res.body.data.slots)).toBe(true);
    });
    
    it('should require serviceId', async () => {
      const res = await request(app)
        .get(`/v1/businesses/${testBusiness._id}/availability`);
      
      expect(res.status).toBe(404);
    });
  });
});

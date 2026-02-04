/**
 * Business Admin Endpoints Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Business Admin Endpoints', () => {
  let testBusiness;
  let authToken;
  
  beforeEach(async () => {
    testBusiness = await global.testHelpers.createTestBusiness({
      code: 'BIZTEST'
    });
    authToken = global.testHelpers.generateTestToken(testBusiness._id);
  });
  
  describe('GET /v1/business/profile', () => {
    it('should return business profile', async () => {
      const res = await request(app)
        .get('/v1/business/profile')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('BIZTEST');
      expect(res.body.data.adminPasswordHash).toBeUndefined();
    });
    
    it('should reject without auth', async () => {
      const res = await request(app)
        .get('/v1/business/profile');
      
      expect(res.status).toBe(401);
    });
    
    it('should reject with invalid token', async () => {
      const res = await request(app)
        .get('/v1/business/profile')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.status).toBe(401);
    });
  });
  
  describe('PUT /v1/business/profile', () => {
    it('should update business profile', async () => {
      const res = await request(app)
        .put('/v1/business/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'Updated Business Name',
          phone: '+359888999888'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Business Name');
      expect(res.body.data.phone).toBe('+359888999888');
    });
  });
  
  describe('Employee CRUD', () => {
    it('should create employee', async () => {
      const res = await request(app)
        .post('/v1/business/employees')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'New Employee',
          color: '#ff5733'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Employee');
      expect(res.body.data.color).toBe('#ff5733');
    });
    
    it('should list employees', async () => {
      await global.testHelpers.createTestEmployee(testBusiness._id);
      
      const res = await request(app)
        .get('/v1/business/employees')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
    
    it('should update employee', async () => {
      const employee = await global.testHelpers.createTestEmployee(testBusiness._id);
      
      const res = await request(app)
        .put(`/v1/business/employees/${employee._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Employee' });
      
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Employee');
    });
    
    it('should delete employee', async () => {
      const employee = await global.testHelpers.createTestEmployee(testBusiness._id);
      
      const res = await request(app)
        .delete(`/v1/business/employees/${employee._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      
      // Verify soft delete
      const Employee = require('../../src/models/Employee');
      const deleted = await Employee.findById(employee._id);
      expect(deleted.status).toBe('deleted');
    });
  });
  
  describe('Service CRUD', () => {
    it('should create service', async () => {
      const res = await request(app)
        .post('/v1/business/services')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'New Service',
          price: 100,
          duration: 90
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Service');
      expect(res.body.data.price).toBe(100);
      expect(res.body.data.duration).toBe(90);
    });
    
    it('should list services', async () => {
      await global.testHelpers.createTestService(testBusiness._id);
      
      const res = await request(app)
        .get('/v1/business/services')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });
  
  describe('Location CRUD', () => {
    it('should create location', async () => {
      const res = await request(app)
        .post('/v1/business/locations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          name: 'New Location',
          address: { city: 'Sofia' },
          workingHours: [
            { day: 'monday', ranges: [{ open: '09:00', close: '18:00' }] }
          ]
        });
      
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('New Location');
    });
  });
});

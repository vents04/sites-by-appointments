/**
 * Auth Integration Tests
 */

const request = require('supertest');
const app = require('../../src/app');

describe('Auth Endpoints', () => {
  let testBusiness;
  
  beforeEach(async () => {
    testBusiness = await global.testHelpers.createTestBusiness({
      code: 'AUTHTEST'
    });
  });
  
  describe('POST /v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ code: 'AUTHTEST', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.business.code).toBe('AUTHTEST');
      expect(res.body.data.expiresAt).toBeDefined();
    });
    
    it('should login with lowercase code', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ code: 'authtest', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    it('should reject invalid code', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ code: 'INVALID', password: 'password123' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
    
    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ code: 'AUTHTEST', password: 'wrongpassword' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
    
    it('should reject suspended business', async () => {
      testBusiness.status = 'suspended';
      await testBusiness.save();
      
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ code: 'AUTHTEST', password: 'password123' });
      
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('BUSINESS_SUSPENDED');
    });
    
    it('should validate input', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ code: 'AB', password: '123' });
      
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
  
  describe('POST /v1/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login
      const loginRes = await request(app)
        .post('/v1/auth/login')
        .send({ code: 'AUTHTEST', password: 'password123' });
      
      const token = loginRes.body.data.token;
      
      // Then logout
      const res = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    
    it('should reject without token', async () => {
      const res = await request(app)
        .post('/v1/auth/logout');
      
      expect(res.status).toBe(401);
    });
  });
  
  describe('PUT /v1/auth/password', () => {
    it('should change password', async () => {
      const token = global.testHelpers.generateTestToken(testBusiness._id);
      
      const res = await request(app)
        .put('/v1/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          currentPassword: 'password123', 
          newPassword: 'newpassword456' 
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Verify new password works
      const loginRes = await request(app)
        .post('/v1/auth/login')
        .send({ code: 'AUTHTEST', password: 'newpassword456' });
      
      expect(loginRes.status).toBe(200);
    });
    
    it('should reject wrong current password', async () => {
      const token = global.testHelpers.generateTestToken(testBusiness._id);
      
      const res = await request(app)
        .put('/v1/auth/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          currentPassword: 'wrongpassword', 
          newPassword: 'newpassword456' 
        });
      
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});

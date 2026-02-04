/**
 * Utility Functions Unit Tests
 */

const { 
  hashPassword, 
  verifyPassword,
  generateBusinessCode,
  sha256,
  generateHMAC,
  verifyHMAC
} = require('../../src/utils/crypto.utils');

const {
  generateUID,
  formatICSDate,
  escapeICS,
  generateICS
} = require('../../src/utils/ics.utils');

const {
  nowUTC,
  parseTimeString,
  canCancelBooking
} = require('../../src/utils/date.utils');

describe('Crypto Utils', () => {
  describe('hashPassword / verifyPassword', () => {
    it('should hash and verify password', async () => {
      const password = 'testpassword123';
      const hash = await hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      
      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });
    
    it('should reject wrong password', async () => {
      const hash = await hashPassword('correct');
      const isValid = await verifyPassword('wrong', hash);
      expect(isValid).toBe(false);
    });
  });
  
  describe('generateBusinessCode', () => {
    it('should generate alphanumeric code', () => {
      const code = generateBusinessCode(6);
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]+$/);
    });
    
    it('should generate different codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateBusinessCode(6));
      }
      expect(codes.size).toBeGreaterThan(90);
    });
  });
  
  describe('sha256', () => {
    it('should create consistent hash', () => {
      const hash1 = sha256('test');
      const hash2 = sha256('test');
      expect(hash1).toBe(hash2);
    });
  });
  
  describe('HMAC', () => {
    it('should generate and verify HMAC', () => {
      const data = 'test data';
      const secret = 'secret';
      const signature = generateHMAC(data, secret);
      
      expect(verifyHMAC(data, signature, secret)).toBe(true);
      expect(verifyHMAC('modified', signature, secret)).toBe(false);
    });
  });
});

describe('ICS Utils', () => {
  describe('generateUID', () => {
    it('should generate valid UID', () => {
      const uid = generateUID();
      expect(uid).toContain('@sitezup.com');
      expect(uid.length).toBeGreaterThan(30);
    });
  });
  
  describe('formatICSDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const formatted = formatICSDate(date);
      expect(formatted).toBe('20240115T103000Z');
    });
  });
  
  describe('escapeICS', () => {
    it('should escape special characters', () => {
      expect(escapeICS('test;value')).toBe('test\\;value');
      expect(escapeICS('test,value')).toBe('test\\,value');
      expect(escapeICS('test\nvalue')).toBe('test\\nvalue');
    });
    
    it('should handle empty string', () => {
      expect(escapeICS('')).toBe('');
      expect(escapeICS(null)).toBe('');
    });
  });
  
  describe('generateICS', () => {
    it('should generate valid ICS content', () => {
      const events = [{
        uid: 'test@sitezup.com',
        dtstart: new Date('2024-01-15T10:00:00Z'),
        dtend: new Date('2024-01-15T11:00:00Z'),
        summary: 'Test Event',
        status: 'confirmed'
      }];
      
      const ics = generateICS(events, { calendarName: 'Test' });
      
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('END:VCALENDAR');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('UID:test@sitezup.com');
      expect(ics).toContain('SUMMARY:Test Event');
    });
  });
});

describe('Date Utils', () => {
  describe('nowUTC', () => {
    it('should return current date', () => {
      const now = nowUTC();
      expect(now instanceof Date).toBe(true);
    });
  });
  
  describe('parseTimeString', () => {
    it('should parse time string', () => {
      const { hours, minutes } = parseTimeString('14:30');
      expect(hours).toBe(14);
      expect(minutes).toBe(30);
    });
  });
  
  describe('canCancelBooking', () => {
    it('should allow cancellation if >24h before', () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      expect(canCancelBooking(futureDate, 24)).toBe(true);
    });
    
    it('should deny cancellation if <24h before', () => {
      const soonDate = new Date(Date.now() + 12 * 60 * 60 * 1000);
      expect(canCancelBooking(soonDate, 24)).toBe(false);
    });
  });
});

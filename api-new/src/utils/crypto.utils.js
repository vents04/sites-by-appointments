/**
 * Cryptography Utility Functions
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Encrypt sensitive data using AES-256-CBC
 * @param {string} text - Plain text to encrypt
 * @param {string} key - Encryption key (must be 32 bytes for AES-256)
 * @returns {string} Encrypted string in format: iv:encryptedData
 */
const encrypt = (text, key) => {
  // Ensure key is 32 bytes
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt data encrypted with encrypt()
 * @param {string} encryptedText - Encrypted string in format: iv:encryptedData
 * @param {string} key - Encryption key
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedText, key) => {
  const [ivHex, encrypted] = encryptedText.split(':');
  const keyBuffer = crypto.scryptSync(key, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
};

/**
 * Generate a random business code
 * @param {number} length - Length of the code (default 6)
 * @returns {string} Random uppercase alphanumeric code
 */
const generateBusinessCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  
  return code;
};

/**
 * Create a hash of data (SHA-256)
 * @param {string} data - Data to hash
 * @returns {string} Hex hash
 */
const sha256 = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @returns {string} HMAC signature in hex
 */
const generateHMAC = (data, secret) => {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} signature - Signature to verify
 * @param {string} secret - Secret key
 * @returns {boolean} True if signature is valid
 */
const verifyHMAC = (data, signature, secret) => {
  const expectedSignature = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

module.exports = {
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  generateRandomString,
  generateBusinessCode,
  sha256,
  generateHMAC,
  verifyHMAC
};

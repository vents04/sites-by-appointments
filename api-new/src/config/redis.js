/**
 * Redis Configuration
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

let redis = null;
let isConnected = false;

const createClient = (url) => {
  if (redis) {
    return redis;
  }

  redis = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    lazyConnect: true
  });

  redis.on('connect', () => {
    logger.info('Connected to Redis');
    isConnected = true;
  });

  redis.on('error', (err) => {
    logger.error('Redis error:', err.message);
    isConnected = false;
  });

  redis.on('close', () => {
    logger.warn('Redis connection closed');
    isConnected = false;
  });

  redis.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  return redis;
};

const connect = async (url) => {
  const client = createClient(url);
  try {
    await client.connect();
    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

const getClient = () => {
  if (!redis) {
    throw new Error('Redis client not initialized. Call createClient first.');
  }
  return redis;
};

const disconnect = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
    isConnected = false;
    logger.info('Disconnected from Redis');
  }
};

// JWT Blacklist helpers
const blacklistToken = async (token, expiresInSeconds) => {
  const client = getClient();
  await client.setex(`jwt:blacklist:${token}`, expiresInSeconds, '1');
};

const isTokenBlacklisted = async (token) => {
  const client = getClient();
  const result = await client.get(`jwt:blacklist:${token}`);
  return result === '1';
};

// Cache helpers
const setCache = async (key, value, ttlSeconds = 300) => {
  const client = getClient();
  await client.setex(key, ttlSeconds, JSON.stringify(value));
};

const getCache = async (key) => {
  const client = getClient();
  const value = await client.get(key);
  return value ? JSON.parse(value) : null;
};

const deleteCache = async (key) => {
  const client = getClient();
  await client.del(key);
};

module.exports = {
  createClient,
  connect,
  getClient,
  disconnect,
  blacklistToken,
  isTokenBlacklisted,
  setCache,
  getCache,
  deleteCache,
  get isConnected() {
    return isConnected;
  }
};

/**
 * Configuration Aggregator
 * Re-exports all configuration modules
 */

const environment = require('./environment');
const database = require('./database');
const redis = require('./redis');

module.exports = {
  ...environment,
  database,
  redis
};

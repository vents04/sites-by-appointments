/**
 * Request Validation Middleware using Zod
 */

const { ValidationError } = require('../utils/errors');

/**
 * Create validation middleware for a Zod schema
 * @param {Object} schema - Zod schema object with body, query, params properties
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const toValidate = {};
      
      if (schema.body) {
        toValidate.body = req.body;
      }
      if (schema.query) {
        toValidate.query = req.query;
      }
      if (schema.params) {
        toValidate.params = req.params;
      }
      
      // Validate each part
      const errors = [];
      
      if (schema.body) {
        const bodyResult = schema.body.safeParse(req.body);
        if (!bodyResult.success) {
          errors.push(...bodyResult.error.issues.map(issue => ({
            field: `body.${issue.path.join('.')}`,
            message: issue.message
          })));
        } else {
          req.body = bodyResult.data;
        }
      }
      
      if (schema.query) {
        const queryResult = schema.query.safeParse(req.query);
        if (!queryResult.success) {
          errors.push(...queryResult.error.issues.map(issue => ({
            field: `query.${issue.path.join('.')}`,
            message: issue.message
          })));
        } else {
          req.query = queryResult.data;
        }
      }
      
      if (schema.params) {
        const paramsResult = schema.params.safeParse(req.params);
        if (!paramsResult.success) {
          errors.push(...paramsResult.error.issues.map(issue => ({
            field: `params.${issue.path.join('.')}`,
            message: issue.message
          })));
        } else {
          req.params = paramsResult.data;
        }
      }
      
      if (errors.length > 0) {
        throw new ValidationError('Validation failed', errors);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate request body only
 * @param {Object} schema - Zod schema for body
 * @returns {Function} Express middleware
 */
const validateBody = (schema) => {
  return validate({ body: schema });
};

/**
 * Validate query parameters only
 * @param {Object} schema - Zod schema for query
 * @returns {Function} Express middleware
 */
const validateQuery = (schema) => {
  return validate({ query: schema });
};

/**
 * Validate route parameters only
 * @param {Object} schema - Zod schema for params
 * @returns {Function} Express middleware
 */
const validateParams = (schema) => {
  return validate({ params: schema });
};

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams
};

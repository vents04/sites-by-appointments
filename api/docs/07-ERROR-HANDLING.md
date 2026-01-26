# Error Handling & Logging

This document covers error handling patterns, logging configuration, and troubleshooting common issues.

## Error Handling Architecture

```
┌─────────────────┐
│  Error occurs   │
│  (any layer)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ResponseError   │  ← Custom error class with status code
│ (optional wrap) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  next(error)    │  ← Pass to Express error handler
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Error Handler   │  ← Central error handler middleware
│ Middleware      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────────┐
│ Logger│ │ Response  │
│       │ │ to Client │
└───────┘ └───────────┘
```

## ResponseError Class

Custom error class that includes HTTP status code.

### Location
`errors/responseError.js`

### Definition

```javascript
class ResponseError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}
```

### Usage

```javascript
const ResponseError = require('../errors/responseError');
const { HTTP_STATUS_CODES } = require('../global');

// In a route handler:
if (!business) {
    return next(new ResponseError('Business not found', HTTP_STATUS_CODES.NOT_FOUND));
}

// Validation error:
if (error) {
    return next(new ResponseError(error.details[0].message, HTTP_STATUS_CODES.BAD_REQUEST));
}

// Server error:
return next(new ResponseError('Failed to process', HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR));
```

### Available Status Codes

```javascript
const HTTP_STATUS_CODES = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};
```

---

## Error Handler Middleware

Central error processing and logging.

### Location
`errors/errorHandler.js`

### Implementation

```javascript
const errorHandler = (error, req, res, next) => {
    // Log the error
    logger.error(error.message, {
        clientIp: req?.headers['x-forwarded-for'] || req?.connection.remoteAddress,
        dt: new Date().getTime()
    });
    
    // Send response to client
    return res.status(error.status || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR).send({
        status: error.status,
        error: error.message,
        dt: new Date().getTime()
    });
};
```

### Response Format

All error responses follow this structure:

```json
{
    "status": 400,
    "error": "\"name\" length must be at least 3 characters long",
    "dt": 1705312345678
}
```

| Field | Description |
|-------|-------------|
| `status` | HTTP status code |
| `error` | Human-readable error message |
| `dt` | Timestamp (milliseconds since epoch) |

---

## Logger

Winston-based logging with environment-aware configuration.

### Location
`errors/logger.js`

### Log Levels

```javascript
const customLevels = {
    levels: {
        trace: 5,   // Most verbose
        debug: 4,
        info: 3,
        warn: 2,
        error: 1,
        fatal: 0    // Least verbose
    }
};
```

### Environment Configuration

| Environment | Log Level | Output |
|-------------|-----------|--------|
| DEVELOPMENT | trace | Console (colored) |
| PRODUCTION | error | File (`logs/error.log`) |

### Usage

```javascript
const Logger = require('./errors/logger');
const logger = new Logger();

logger.trace('Detailed trace info', { extra: 'data' });
logger.debug('Debug information');
logger.info('Informational message');
logger.warn('Warning message');
logger.error('Error occurred', { stack: error.stack });
logger.fatal('Critical failure');
```

### Log Output Format

Console output (DEVELOPMENT):
```
2024-01-15 10:30:45 [error]: Error message {
  "clientIp": "192.168.1.1",
  "dt": 1705312345678
}
```

File output (PRODUCTION):
- Written to `logs/error.log`
- Only error-level and above
- JSON format for parsing

---

## Error Patterns in Routes

### Pattern 1: Validation Errors

```javascript
router.post('/', async (req, res, next) => {
    // Validate request body
    const { error } = businessPostValidation(req.body);
    if (error) {
        return next(new ResponseError(
            error.details[0].message, 
            HTTP_STATUS_CODES.BAD_REQUEST
        ));
    }
    // Continue processing...
});
```

### Pattern 2: Not Found Errors

```javascript
const business = await DbService.getById(COLLECTIONS.BUSINESSES, id);

// Check existence and soft-delete
if (!business || business.status === 'deleted') {
    return next(new ResponseError('errors.not_found', HTTP_STATUS_CODES.NOT_FOUND));
}
```

### Pattern 3: Status Check Errors

```javascript
// Check if entity is active
if (business.status !== 'active') {
    return next(new ResponseError('errors.inactive', HTTP_STATUS_CODES.CONFLICT));
}
```

### Pattern 4: Business Logic Errors

```javascript
// Check service belongs to correct business
if (service.businessId.toString() !== calendar.businessId.toString()) {
    return next(new ResponseError('errors.invalid_business', HTTP_STATUS_CODES.CONFLICT));
}
```

### Pattern 5: Try-Catch with Generic Error

```javascript
router.post('/', async (req, res, next) => {
    try {
        // Business logic...
        return res.sendStatus(HTTP_STATUS_CODES.CREATED);
    } catch (error) {
        return next(new ResponseError(
            error.message || DEFAULT_ERROR_MESSAGE,
            error.status || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR
        ));
    }
});
```

---

## Error Messages

### Client-Facing Error Codes

The API uses internationalization-ready error codes:

| Error Code | Meaning | HTTP Status |
|------------|---------|-------------|
| `errors.not_found` | Resource not found or deleted | 404 |
| `errors.inactive` | Resource is inactive | 409 |
| `errors.invalid_id` | Invalid ObjectId format | 400 |
| `errors.invalid_business` | Cross-business reference | 409 |
| `errors.invalid_service` | Employee-service mismatch | 409 |
| `errors.invalid_duration` | Duration mismatch | 409 |
| `errors.invalid_time_slot_or_unavailable` | Slot not available | 409 |
| `errors.teamup_event_creation_failed` | External API failure | 500 |
| `errors.internal_server_error` | Generic server error | 500 |

### Joi Validation Messages

Joi provides detailed validation messages:

```javascript
// Examples of Joi error messages:
'"name" is required'
'"name" length must be at least 3 characters long'
'"email" must be a valid email'
'"slotTime" must be greater than or equal to 1'
'"status" must be one of [active, inactive, deleted]'
```

---

## Debugging Guide

### Reading Error Logs

In development, errors appear in the console:

```
2024-01-15 14:30:22 [error]: "name" length must be at least 3 characters long {
  "clientIp": "::1",
  "dt": 1705323022000
}
```

In production, check `logs/error.log`:

```bash
tail -f api/logs/error.log
```

### Common Error Scenarios

#### 1. MongoDB Connection Failed

**Error:**
```
Error while connecting to Mongo
```

**Troubleshooting:**
1. Check MongoDB is running: `mongod --version`
2. Verify `CLUSTER_URI` in `.env`
3. Check network connectivity
4. For Atlas: verify IP whitelist

#### 2. Invalid ObjectId

**Error:**
```json
{"status": 400, "error": "errors.invalid_id"}
```

**Cause:** Non-ObjectId string passed as ID parameter.

**Fix:** Ensure IDs are valid 24-character hex strings.

#### 3. Entity Not Found

**Error:**
```json
{"status": 404, "error": "errors.not_found"}
```

**Troubleshooting:**
1. Verify ID exists in database
2. Check status is not 'deleted'
3. Confirm you're querying correct collection

#### 4. Time Slot Unavailable

**Error:**
```json
{"status": 409, "error": "errors.invalid_time_slot_or_unavailable"}
```

**Causes:**
- Slot overlaps existing event
- Slot is outside working hours
- Slot is before minimum advance time
- Service duration doesn't match slot duration

**Debug:**
1. Call `GET /event/available` to see actual available slots
2. Check location working hours
3. Verify calendar sync is up to date

#### 5. Teamup Integration Failure

**Error:**
```json
{"status": 500, "error": "errors.teamup_event_creation_failed"}
```

**Troubleshooting:**
1. Verify Teamup API key is valid
2. Check Teamup calendar key is correct
3. Ensure sub-calendar IDs exist
4. Check Teamup API status

#### 6. Email Sending Failed

**In logs:**
```
Error sending email: { ... SMTP error ... }
```

**Troubleshooting:**
1. Verify Gmail app password (not regular password)
2. Check sender email is correct
3. Ensure "Less secure apps" or App Passwords enabled
4. Verify recipient email format

---

## Adding Custom Error Handling

### Creating Custom Error Types

```javascript
// errors/customError.js
class ValidationError extends ResponseError {
    constructor(field, message) {
        super(`Validation failed: ${field} - ${message}`, 400);
        this.field = field;
    }
}

class ExternalServiceError extends ResponseError {
    constructor(service, originalError) {
        super(`${service} service failed`, 500);
        this.service = service;
        this.originalError = originalError;
    }
}
```

### Adding Error Codes

If adding new error codes, update `global.js`:

```javascript
const ERROR_CODES = {
    // ... existing codes
    NEW_ERROR: 'errors.new_error'
};

module.exports = { 
    // ... existing exports
    ERROR_CODES 
};
```

---

## Monitoring Recommendations

### Production Checklist

1. **Log Rotation:** Implement log rotation to prevent disk fill
   ```bash
   # Example: rotate logs daily, keep 7 days
   logrotate /etc/logrotate.d/api-logs
   ```

2. **External Logging:** Consider services like:
   - Papertrail
   - Loggly
   - AWS CloudWatch
   - Datadog

3. **Error Alerting:** Set up alerts for:
   - High error rates (> X errors/minute)
   - Specific fatal errors
   - External service failures (Teamup, SMTP)

4. **Health Checks:** Add a health check endpoint:
   ```javascript
   router.get('/health', (req, res) => {
       res.status(200).json({ status: 'healthy', timestamp: new Date() });
   });
   ```

### Metrics to Track

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| Error rate | Errors per minute | > 10/min |
| Response time | Average API response time | > 2000ms |
| Teamup failures | Failed Teamup API calls | Any |
| Email failures | Failed email sends | > 5% |
| Rate limit hits | Rate-limited requests | > 50/hour |

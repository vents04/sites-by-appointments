# Implementation Guidelines

## 1. Project Structure

```
api-new/
├── src/
│   ├── app.js                 # Express app setup
│   ├── server.js              # Server entry point
│   │
│   ├── config/
│   │   ├── index.js           # Config aggregator
│   │   ├── database.js        # MongoDB connection
│   │   ├── redis.js           # Redis connection
│   │   └── environment.js     # Environment validation
│   │
│   ├── models/
│   │   ├── index.js           # Model exports
│   │   ├── Business.js
│   │   ├── Employee.js
│   │   ├── Service.js
│   │   ├── Location.js
│   │   ├── Customer.js
│   │   ├── Event.js
│   │   └── AdminSession.js
│   │
│   ├── routes/
│   │   ├── index.js           # Route aggregator
│   │   ├── auth.routes.js     # /auth/*
│   │   ├── public.routes.js   # /businesses/*, /bookings/*
│   │   ├── business.routes.js # /business/* (admin)
│   │   └── admin.routes.js    # /admin/* (super admin)
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── public.controller.js
│   │   ├── business.controller.js
│   │   └── admin.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── business.service.js
│   │   ├── calendar.service.js
│   │   ├── booking.service.js
│   │   ├── email.service.js
│   │   ├── ics.service.js
│   │   └── notification.service.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── superAdmin.middleware.js
│   │   ├── validation.middleware.js
│   │   ├── i18n.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── errorHandler.middleware.js
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── booking.validator.js
│   │   ├── business.validator.js
│   │   └── common.validator.js
│   │
│   ├── websocket/
│   │   ├── index.js           # Socket.io setup
│   │   ├── auth.js            # WS authentication
│   │   └── handlers.js        # Event handlers
│   │
│   ├── i18n/
│   │   ├── index.js           # i18next setup
│   │   ├── bg/
│   │   │   ├── common.json
│   │   │   ├── errors.json
│   │   │   └── emails.json
│   │   └── en/
│   │       ├── common.json
│   │       ├── errors.json
│   │       └── emails.json
│   │
│   └── utils/
│       ├── errors.js          # Custom error classes
│       ├── logger.js          # Winston logger
│       ├── ics.utils.js       # ICS generation helpers
│       ├── date.utils.js      # Date manipulation
│       └── crypto.utils.js    # Encryption helpers
│
├── tests/
│   ├── setup.js
│   ├── fixtures/
│   ├── unit/
│   └── integration/
│
├── logs/
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── jest.config.js
├── package.json
└── README.md
```

## 2. Coding Standards

### 2.1 File Naming

- Use `kebab-case` for file names: `auth.service.js`, `business.routes.js`
- Use `.js` extension (not TypeScript for MVP)
- Group by feature type (routes, services, models)

### 2.2 Code Style

```javascript
// Use async/await, not callbacks or raw promises
async function getBusinessByCode(code) {
  const business = await Business.findOne({ code, status: 'active' });
  if (!business) {
    throw new NotFoundError('BUSINESS_NOT_FOUND', 'Business not found');
  }
  return business;
}

// Use destructuring
const { code, password } = req.body;

// Use const by default, let when needed, never var
const MAX_ATTEMPTS = 5;
let retryCount = 0;

// Export at the bottom
module.exports = { getBusinessByCode };
```

### 2.3 Error Handling

```javascript
// Custom error classes
class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

class NotFoundError extends AppError {
  constructor(code, message) {
    super(code, message, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(code = 'UNAUTHORIZED', message = 'Unauthorized') {
    super(code, message, 401);
  }
}

class ConflictError extends AppError {
  constructor(code, message) {
    super(code, message, 409);
  }
}
```

### 2.4 Controller Pattern

```javascript
// controllers/auth.controller.js
const authService = require('../services/auth.service');

const login = async (req, res, next) => {
  try {
    const { code, password } = req.body;
    const result = await authService.login(code, password);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { login };
```

### 2.5 Service Pattern

```javascript
// services/auth.service.js
const Business = require('../models/Business');
const { UnauthorizedError } = require('../utils/errors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const config = require('../config');

const login = async (code, password) => {
  const business = await Business.findOne({ 
    code: code.toUpperCase(), 
    status: { $in: ['active', 'inactive'] }
  }).select('+adminPasswordHash');
  
  if (!business) {
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid code or password');
  }
  
  if (business.status === 'suspended') {
    throw new UnauthorizedError('BUSINESS_SUSPENDED', 'Business is suspended');
  }
  
  const isValid = await bcrypt.compare(password, business.adminPasswordHash);
  if (!isValid) {
    throw new UnauthorizedError('INVALID_CREDENTIALS', 'Invalid code or password');
  }
  
  const token = jwt.sign(
    { businessId: business._id, type: 'business_admin' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  
  return {
    token,
    expiresAt,
    business: {
      id: business._id,
      code: business.code,
      name: business.name,
      logo: business.logo,
      defaultLanguage: business.defaultLanguage,
      timezone: business.timezone
    }
  };
};

module.exports = { login };
```

## 3. Middleware Implementation

### 3.1 JWT Authentication

```javascript
// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const redis = require('../config/redis');
const { UnauthorizedError } = require('../utils/errors');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('UNAUTHORIZED', 'No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    
    // Check if token is blacklisted
    const isBlacklisted = await redis.get(`jwt:blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('TOKEN_EXPIRED', 'Token has been revoked');
    }
    
    const decoded = jwt.verify(token, config.jwt.secret);
    
    req.businessId = decoded.businessId;
    req.tokenType = decoded.type;
    req.token = token;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('UNAUTHORIZED', 'Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('TOKEN_EXPIRED', 'Token has expired'));
    } else {
      next(error);
    }
  }
};

module.exports = { authenticate };
```

### 3.2 Super Admin Authentication

```javascript
// middlewares/superAdmin.middleware.js
const config = require('../config');
const { UnauthorizedError } = require('../utils/errors');

const authenticateSuperAdmin = (req, res, next) => {
  const apiKey = req.headers['x-super-admin-key'];
  
  if (!apiKey || apiKey !== config.superAdminKey) {
    throw new UnauthorizedError('UNAUTHORIZED', 'Invalid super admin key');
  }
  
  req.isSuperAdmin = true;
  next();
};

module.exports = { authenticateSuperAdmin };
```

### 3.3 Validation Middleware

```javascript
// middlewares/validation.middleware.js
const { ValidationError } = require('../utils/errors');

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  if (!result.success) {
    const details = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message
    }));
    throw new ValidationError('Invalid input data', details);
  }
  
  // Replace with parsed/transformed data
  req.body = result.data.body;
  req.query = result.data.query;
  req.params = result.data.params;
  
  next();
};

module.exports = { validate };
```

### 3.4 Error Handler

```javascript
// middlewares/errorHandler.middleware.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error({
    message: err.message,
    code: err.code,
    stack: err.stack,
    path: req.path,
    method: req.method,
    businessId: req.businessId
  });
  
  // Operational errors (expected)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: req.t ? req.t(`errors:${err.code}`, err.message) : err.message,
        details: err.details
      }
    });
  }
  
  // Programming errors (unexpected)
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
};

module.exports = errorHandler;
```

## 4. Database Configuration

```javascript
// config/database.js
const mongoose = require('mongoose');
const config = require('./environment');
const logger = require('../utils/logger');

const connect = async () => {
  try {
    await mongoose.connect(config.mongodbUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    logger.info('Connected to MongoDB');
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });
    
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = { connect };
```

## 5. Redis Configuration

```javascript
// config/redis.js
const Redis = require('ioredis');
const config = require('./environment');
const logger = require('../utils/logger');

const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: true
});

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', (err) => {
  logger.error('Redis error:', err);
});

module.exports = redis;
```

## 6. WebSocket Implementation

```javascript
// websocket/index.js
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const redis = require('../config/redis');
const { authenticateSocket } = require('./auth');
const handlers = require('./handlers');
const logger = require('../utils/logger');

const setupWebSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS.split(','),
      credentials: true
    },
    transports: ['websocket', 'polling']
  });
  
  // Redis adapter for scaling
  const pubClient = redis.duplicate();
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));
  
  // Authentication middleware
  io.use(authenticateSocket);
  
  io.on('connection', (socket) => {
    logger.info(`WebSocket connected: ${socket.id}, business: ${socket.businessId}`);
    
    socket.on('join_business_room', (data) => {
      handlers.joinRoom(socket, data);
    });
    
    socket.on('leave_business_room', (data) => {
      handlers.leaveRoom(socket, data);
    });
    
    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: ${socket.id}`);
    });
  });
  
  return io;
};

// Broadcast helper
const broadcast = (io, businessId, event, data) => {
  io.to(`business:${businessId}`).emit(event, data);
};

module.exports = { setupWebSocket, broadcast };
```

## 7. i18n Setup

```javascript
// i18n/index.js
const i18next = require('i18next');
const Backend = require('i18next-fs-backend');
const middleware = require('i18next-http-middleware');
const path = require('path');

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'bg',
    supportedLngs: ['bg', 'en'],
    defaultNS: 'common',
    ns: ['common', 'errors', 'emails'],
    backend: {
      loadPath: path.join(__dirname, '{{lng}}/{{ns}}.json')
    },
    detection: {
      order: ['header'],
      lookupHeader: 'accept-language'
    }
  });

module.exports = { i18next, i18nMiddleware: middleware.handle(i18next) };
```

## 8. Environment Variables

```bash
# .env.example

# Server
NODE_ENV=development
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sites-appointments

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRES_IN=30d

# Super Admin
SUPER_ADMIN_KEY=your-super-admin-api-key

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:19006

# Logging
LOG_LEVEL=debug
```

## 9. Testing Strategy

### 9.1 Test Setup

```javascript
// tests/setup.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

### 9.2 Integration Test Example

```javascript
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../src/app');
const Business = require('../../src/models/Business');
const bcrypt = require('bcrypt');

describe('Auth Endpoints', () => {
  let testBusiness;
  
  beforeEach(async () => {
    testBusiness = await Business.create({
      code: 'TEST1',
      name: 'Test Business',
      adminPasswordHash: await bcrypt.hash('password123', 10),
      timezone: 'Europe/Sofia',
      status: 'active'
    });
  });
  
  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ code: 'TEST1', password: 'password123' });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.business.code).toBe('TEST1');
    });
    
    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/v1/auth/login')
        .send({ code: 'TEST1', password: 'wrongpassword' });
      
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });
});
```

## 10. Logging

```javascript
// utils/logger.js
const winston = require('winston');
const config = require('../config');

const logger = winston.createLogger({
  level: config.logLevel || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sites-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

module.exports = logger;
```

## 11. ICS Generation

```javascript
// utils/ics.utils.js
const { v4: uuidv4 } = require('uuid');

const generateICS = (events, calendarName = 'Appointments') => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sites By Appointments//EN',
    `X-WR-CALNAME:${calendarName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];
  
  for (const event of events) {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}`);
    lines.push(`DTSTART:${formatICSDate(event.dtstart)}`);
    lines.push(`DTEND:${formatICSDate(event.dtend)}`);
    lines.push(`SUMMARY:${escapeICS(event.summary || 'Appointment')}`);
    
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
    }
    
    if (event.rrule) {
      lines.push(`RRULE:${event.rrule}`);
    }
    
    lines.push(`SEQUENCE:${event.sequence || 0}`);
    lines.push(`STATUS:${event.status === 'confirmed' ? 'CONFIRMED' : 'CANCELLED'}`);
    lines.push('END:VEVENT');
  }
  
  lines.push('END:VCALENDAR');
  
  return lines.join('\r\n');
};

const formatICSDate = (date) => {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
};

const escapeICS = (str) => {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

const generateUID = () => `${uuidv4()}@sitezup.com`;

module.exports = { generateICS, generateUID, formatICSDate };
```

## 12. npm Scripts

```json
{
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write \"src/**/*.js\""
  }
}
```

## 13. Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection string updated
- [ ] Redis connection string updated
- [ ] JWT secret is cryptographically secure
- [ ] Super admin key is set
- [ ] CORS origins configured
- [ ] Rate limiting configured
- [ ] SSL/TLS enabled
- [ ] Logging configured for production
- [ ] Health check endpoint working
- [ ] WebSocket connections tested
- [ ] Email sending tested

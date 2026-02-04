# Tech Stack Specification

## 1. Overview

This document details the technology choices for the Sites By Appointments API, including rationale for each decision.

## 2. Core Technologies

### 2.1 Runtime Environment

| Component | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20.x LTS | JavaScript runtime |
| **npm** | 10.x | Package manager |

**Rationale**: Node.js 20 LTS provides long-term support, improved performance, and native fetch API support. It's stable for production use.

### 2.2 Web Framework

| Component | Version | Purpose |
|-----------|---------|---------|
| **Express.js** | 4.x | HTTP server framework |

**Rationale**: Express is already in use in the existing API, well-documented, and has a mature ecosystem. Moving to a different framework (Fastify, Koa) would provide marginal benefits at significant refactoring cost.

## 3. Database Layer

### 3.1 Primary Database

| Component | Version | Purpose |
|-----------|---------|---------|
| **MongoDB** | 7.x | Document database |
| **Mongoose** | 8.x | ODM for MongoDB |

**Rationale**: 
- Already in use, team has experience
- Flexible schema suits multi-tenant SaaS
- Good for hierarchical data (business → locations → employees)
- Native support for geospatial queries (location features)

**Configuration**:
```javascript
// All dates stored as UTC
mongoose.set('strictQuery', true);

// Connection options
{
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
}
```

### 3.2 Cache & Session Store

| Component | Version | Purpose |
|-----------|---------|---------|
| **Redis** | 7.x | Caching, session store, pub/sub |
| **ioredis** | 5.x | Redis client for Node.js |

**Rationale**:
- JWT blacklist for logout functionality
- Rate limiting state storage
- WebSocket adapter for horizontal scaling
- Business configuration caching

**Use Cases**:
```
redis:jwt:blacklist:{token}     → TTL: token expiry
redis:ratelimit:{ip}:{endpoint} → TTL: window size
redis:cache:business:{code}     → TTL: 5 minutes
redis:ws:sessions:{socketId}    → business room mapping
```

## 4. Real-Time Communication

| Component | Version | Purpose |
|-----------|---------|---------|
| **Socket.io** | 4.x | WebSocket server |
| **@socket.io/redis-adapter** | 8.x | Redis adapter for scaling |

**Rationale**:
- Robust fallback mechanisms (long-polling)
- Room-based broadcasting fits multi-tenant model
- Redis adapter enables horizontal scaling
- Good React Native support

**Configuration**:
```javascript
{
  cors: {
    origin: process.env.ALLOWED_ORIGINS.split(','),
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 20000
}
```

## 5. Authentication & Security

### 5.1 Authentication

| Component | Version | Purpose |
|-----------|---------|---------|
| **jsonwebtoken** | 9.x | JWT creation/verification |
| **bcrypt** | 5.x | Password hashing |

**JWT Configuration**:
```javascript
{
  algorithm: 'HS256',
  expiresIn: '30d',  // Monthly login requirement
  issuer: 'sites-by-appointments'
}
```

### 5.2 Security Middleware

| Component | Version | Purpose |
|-----------|---------|---------|
| **helmet** | 7.x | Security headers |
| **cors** | 2.x | CORS handling |
| **express-rate-limit** | 7.x | Rate limiting |
| **rate-limit-redis** | 4.x | Redis store for rate limiting |

**Rate Limiting Configuration**:
```javascript
// Public endpoints
{ windowMs: 15 * 60 * 1000, max: 100 }

// Auth endpoints (stricter)
{ windowMs: 15 * 60 * 1000, max: 10 }

// Business admin endpoints
{ windowMs: 60 * 1000, max: 60 }
```

## 6. Validation

| Component | Version | Purpose |
|-----------|---------|---------|
| **Zod** | 3.x | Schema validation |

**Rationale**:
- Better TypeScript inference than Joi
- Smaller bundle size
- More intuitive API
- First-class support for transforms

**Example**:
```javascript
const createBookingSchema = z.object({
  businessId: z.string().regex(/^[a-f\d]{24}$/i),
  serviceId: z.string().regex(/^[a-f\d]{24}$/i),
  employeeId: z.string().regex(/^[a-f\d]{24}$/i),
  startTime: z.string().datetime(),
  customer: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().min(6).max(20)
  })
});
```

## 7. Internationalization

| Component | Version | Purpose |
|-----------|---------|---------|
| **i18next** | 23.x | i18n framework |
| **i18next-http-middleware** | 3.x | Express middleware |
| **i18next-fs-backend** | 2.x | File-based translations |

**Configuration**:
```javascript
{
  fallbackLng: 'bg',
  supportedLngs: ['bg', 'en'],
  defaultNS: 'common',
  ns: ['common', 'errors', 'emails'],
  backend: {
    loadPath: './src/i18n/{{lng}}/{{ns}}.json'
  }
}
```

**Folder Structure**:
```
src/i18n/
├── bg/
│   ├── common.json
│   ├── errors.json
│   └── emails.json
└── en/
    ├── common.json
    ├── errors.json
    └── emails.json
```

## 8. Date & Time Handling

| Component | Version | Purpose |
|-----------|---------|---------|
| **date-fns** | 3.x | Date manipulation |
| **date-fns-tz** | 3.x | Timezone support |

**Rationale**:
- Replaces moment-timezone (deprecated)
- Tree-shakeable (smaller bundle)
- Immutable operations
- Better TypeScript support

**Usage Pattern**:
```javascript
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';

// Store in UTC
const utcDate = zonedTimeToUtc(localDate, 'Europe/Sofia');

// Display in local timezone (done on client)
const localDate = utcToZonedTime(utcDate, 'Europe/Sofia');
```

## 9. Email Service

| Component | Version | Purpose |
|-----------|---------|---------|
| **nodemailer** | 6.x | Email sending |

**Rationale**: Already in use, reliable, supports multiple providers.

**Configuration**:
```javascript
{
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
}
```

## 10. Logging & Monitoring

| Component | Version | Purpose |
|-----------|---------|---------|
| **winston** | 3.x | Logging |
| **morgan** | 1.x | HTTP request logging |

**Log Format**:
```javascript
{
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'sites-api' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
}
```

## 11. Testing

| Component | Version | Purpose |
|-----------|---------|---------|
| **Jest** | 29.x | Test framework |
| **Supertest** | 6.x | HTTP assertions |
| **mongodb-memory-server** | 9.x | In-memory MongoDB for tests |

**Jest Configuration**:
```javascript
{
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['./tests/setup.js']
}
```

## 12. Development Tools

| Component | Version | Purpose |
|-----------|---------|---------|
| **nodemon** | 3.x | Development auto-reload |
| **dotenv** | 16.x | Environment variables |
| **eslint** | 8.x | Code linting |
| **prettier** | 3.x | Code formatting |

## 13. Package.json Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "ioredis": "^5.3.2",
    "socket.io": "^4.7.2",
    "@socket.io/redis-adapter": "^8.2.1",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "zod": "^3.22.4",
    "i18next": "^23.7.6",
    "i18next-http-middleware": "^3.5.0",
    "i18next-fs-backend": "^2.3.0",
    "date-fns": "^3.0.6",
    "date-fns-tz": "^3.0.0",
    "nodemailer": "^6.9.7",
    "winston": "^3.11.0",
    "morgan": "^1.10.0",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "express-rate-limit": "^7.1.5",
    "rate-limit-redis": "^4.2.0",
    "uuid": "^9.0.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "mongodb-memory-server": "^9.1.3",
    "nodemon": "^3.0.2",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  }
}
```

## 14. Environment Variables

```bash
# Server
NODE_ENV=production
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sites-appointments

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=30d

# Super Admin
SUPER_ADMIN_KEY=your-super-admin-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://app.sitezup.com

# Logging
LOG_LEVEL=info
```

## 15. Version Compatibility Matrix

| Node.js | MongoDB | Redis | Mongoose | Socket.io |
|---------|---------|-------|----------|-----------|
| 20.x    | 7.x     | 7.x   | 8.x      | 4.x       |
| 18.x    | 6.x     | 6.x   | 7.x      | 4.x       |

**Recommended**: Use the top row (latest stable versions) for new deployments.

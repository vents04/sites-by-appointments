# Getting Started

This guide will help you set up and run the API locally for development.

## Prerequisites

Before you begin, make sure you have:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** - Either local installation or MongoDB Atlas account
- **Teamup Account** (optional) - For calendar integration

### Verifying Prerequisites

```bash
# Check Node.js version
node --version  # Should be v16.x or higher

# Check npm version
npm --version   # Should be v8.x or higher
```

## Installation Steps

### Step 1: Clone and Navigate

```bash
cd api
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all required packages:

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.18.2 | Web framework |
| mongoose | ^7.3.2 | MongoDB ODM |
| @hapi/joi | ^17.1.1 | Validation |
| jsonwebtoken | ^9.0.1 | JWT authentication |
| bcrypt | ^5.1.0 | Password hashing |
| nodemailer | ^6.10.0 | Email sending |
| axios | ^1.7.9 | HTTP client |
| winston | ^3.9.0 | Logging |
| moment-timezone | ^0.5.46 | Time handling |
| dotenv | ^16.4.7 | Environment variables |
| cors | ^2.8.5 | Cross-origin requests |
| express-rate-limit | ^7.5.0 | Rate limiting |

### Step 3: Configure Environment Variables

Create a `.env` file in the `api` folder:

```bash
cp .env.example .env
```

Edit the `.env` file with your settings:

```env
# Database Configuration
CLUSTER_URI=mongodb://localhost:27017
DATABASE_NAME=appointments

# Server Configuration
PORT=3001
ENVIRONMENT=DEVELOPMENT

# Security
JWT_SECRET=your-secret-key-here-make-it-long-and-random
ADMIN_PASSWORD=your-admin-password
CRYPTO_KEY=your-encryption-key-for-sensitive-data

# Teamup Integration (optional)
WEBHOOK_SECRET=your-teamup-webhook-secret
```

#### Environment Variables Explained

| Variable | Required | Description |
|----------|----------|-------------|
| `CLUSTER_URI` | Yes | MongoDB connection string |
| `DATABASE_NAME` | Yes | Name of the database to use |
| `PORT` | Yes | Port for the API server |
| `ENVIRONMENT` | Yes | `DEVELOPMENT` or `PRODUCTION` |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `ADMIN_PASSWORD` | Yes | Password for admin API endpoints |
| `CRYPTO_KEY` | Yes | Key for encrypting sensitive data |
| `WEBHOOK_SECRET` | No | Secret for validating Teamup webhooks |

### Step 4: Start MongoDB (if local)

If using local MongoDB:

```bash
# macOS with Homebrew
brew services start mongodb-community

# Or start manually
mongod --dbpath /path/to/data
```

### Step 5: Run the API

```bash
node api.js
```

You should see:

```
═══════════════════════════════════════════════════════════════
Starting API server...
Port: 3001
Environment: DEVELOPMENT
═══════════════════════════════════════════════════════════════
Connected to database
✓ API server is listening on port 3001
✓ Server URL: http://localhost:3001
✓ Ready to accept requests from kerelski.com
```

## Verifying the Installation

### Test the API is Running

```bash
curl http://localhost:3001/business/test
```

You should get a response (either business data or a "not found" error - both indicate the API is working).

## Project Structure Overview

```
api/
├── api.js                 # Entry point - starts the server
├── global.js              # Constants and enums
├── package.json           # Dependencies
├── .env                   # Environment variables (create this)
├── .env.example           # Environment template
│
├── db/                    # Database layer
│   ├── mongo.js           # MongoDB connection
│   └── models/            # Mongoose schemas
│       ├── Business.model.js
│       ├── Calendar.model.js
│       ├── Employee.model.js
│       ├── Event.model.js
│       ├── Location.model.js
│       ├── Notice.model.js
│       ├── PersonalData.model.js
│       └── Service.model.js
│
├── routes/                # HTTP endpoints
│   ├── index.route.js     # Route aggregator
│   ├── business.route.js
│   ├── calendar.route.js
│   ├── employee.route.js
│   ├── event.route.js
│   ├── location.route.js
│   ├── notice.route.js
│   ├── service.route.js
│   └── webhook.route.js
│
├── services/              # Business logic
│   ├── authentication.service.js
│   ├── calendar.service.js
│   ├── crypto.service.js
│   ├── db.service.js
│   ├── email.service.js
│   └── teamup.service.js
│
├── middlewares/           # Express middlewares
│   └── adminAuthenticate.js
│
├── validation/            # Request validation
│   └── hapi.js
│
├── errors/                # Error handling
│   ├── errorHandler.js
│   ├── logger.js
│   └── responseError.js
│
├── enums/                 # Enumerations
│   └── integrations.enum.js
│
└── logs/                  # Log files
    └── error.log
```

## Setting Up Your First Business

To test the full flow, you'll need to create some data. Here's how to create a business via the API:

### 1. Create a Business

```bash
curl -X POST http://localhost:3001/business \
  -H "Content-Type: application/json" \
  -H "admin_password: your-admin-password" \
  -d '{
    "name": "Test Salon",
    "description": "A test hair salon",
    "phone": "+1234567890",
    "email": "test@salon.com",
    "website": "https://testsalon.com",
    "URLpostfix": "test-salon",
    "slotTime": 15,
    "maximumDaysInFuture": 30,
    "minimumTimeSlotsInFuture": 2,
    "status": "active",
    "isEmailSender": false
  }'
```

### 2. Create a Service

```bash
curl -X POST http://localhost:3001/service \
  -H "Content-Type: application/json" \
  -H "admin_password: your-admin-password" \
  -d '{
    "name": "Haircut",
    "price": 25,
    "priceEur": "25.00",
    "currency": "EUR",
    "timeSlots": 2,
    "businessId": "BUSINESS_ID_FROM_STEP_1",
    "status": "active"
  }'
```

### 3. Create an Employee

```bash
curl -X POST http://localhost:3001/employee \
  -H "Content-Type: application/json" \
  -H "admin_password: your-admin-password" \
  -d '{
    "name": "John Stylist",
    "teamupSubcalendarId": "12345",
    "businessId": "BUSINESS_ID",
    "services": ["SERVICE_ID"],
    "status": "active"
  }'
```

### 4. Create a Location

```bash
curl -X POST http://localhost:3001/location \
  -H "Content-Type: application/json" \
  -H "admin_password: your-admin-password" \
  -d '{
    "name": "Main Branch",
    "addressName": "123 Main Street",
    "lat": 42.6977,
    "lon": 23.3219,
    "phone": "+1234567890",
    "businessId": "BUSINESS_ID",
    "employees": ["EMPLOYEE_ID"],
    "workingHours": [
      {"day": "monday", "open": "09:00", "close": "18:00"},
      {"day": "tuesday", "open": "09:00", "close": "18:00"},
      {"day": "wednesday", "open": "09:00", "close": "18:00"},
      {"day": "thursday", "open": "09:00", "close": "18:00"},
      {"day": "friday", "open": "09:00", "close": "18:00"}
    ],
    "status": "active"
  }'
```

## Common Issues and Solutions

### Issue: "Cannot connect to MongoDB"

**Symptoms:**
```
Error while connecting to Mongo
```

**Solutions:**
1. Ensure MongoDB is running
2. Check your `CLUSTER_URI` in `.env`
3. If using MongoDB Atlas, whitelist your IP address

### Issue: "Unauthorized" on admin endpoints

**Symptoms:**
```
{"status":401,"error":"Unauthorized"}
```

**Solutions:**
1. Include the `admin_password` header in your request
2. Verify the password matches `ADMIN_PASSWORD` in `.env`

### Issue: "Too many requests"

**Symptoms:**
```
Too many requests, please try again later.
```

**Solutions:**
The API has rate limiting (100 requests per 15 minutes). Wait or adjust the limits in `api.js` for development.

## Development Tips

### Using Nodemon for Auto-reload

Install nodemon for automatic restarts during development:

```bash
npm install -g nodemon
nodemon api.js
```

### Viewing Logs

In development mode (`ENVIRONMENT=DEVELOPMENT`), logs are printed to the console. In production, they're written to `logs/error.log`.

### Testing Endpoints

We recommend using:
- [Postman](https://www.postman.com/) - GUI-based API testing
- [curl](https://curl.se/) - Command-line testing
- [Insomnia](https://insomnia.rest/) - Alternative to Postman

## Next Steps

Now that you have the API running:

1. Read the [Architecture](./02-ARCHITECTURE.md) to understand how components interact
2. Explore the [Data Models](./03-DATA-MODELS.md) to understand the database structure
3. Check the [API Endpoints](./04-API-ENDPOINTS.md) for the complete API reference

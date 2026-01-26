# Services

This document details all service modules, their methods, and how to use them. Services contain the business logic and are the core of the application.

## Service Overview

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| DbService | Database operations | mongoose |
| CalendarService | Time slot calculations | DbService, TeamupService, moment-timezone |
| TeamupService | Teamup API integration | axios |
| EmailService | Email notifications | nodemailer, CryptoService |
| CryptoService | Encryption/decryption | crypto |
| AuthenticationService | JWT & password handling | jsonwebtoken, bcrypt |

---

## DbService

Generic database operations wrapper around MongoDB/Mongoose.

### Location
`services/db.service.js`

### Methods

#### getOne(collection, filter)
Find a single document matching the filter.

```javascript
const DbService = require('./services/db.service');
const { COLLECTIONS } = require('./global');

// Find business by website
const business = await DbService.getOne(COLLECTIONS.BUSINESSES, { 
    website: "https://example.com" 
});

// Find with regex (case-insensitive)
const business = await DbService.getOne(COLLECTIONS.BUSINESSES, { 
    website: { "$regex": "example", "$options": 'i' } 
});
```

#### getById(collection, id)
Find a document by its ObjectId.

```javascript
const mongoose = require('mongoose');

const businessId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
const business = await DbService.getById(COLLECTIONS.BUSINESSES, businessId);
```

#### getMany(collection, filter)
Find all documents matching the filter.

```javascript
// Get all active services for a business
const services = await DbService.getMany(COLLECTIONS.SERVICES, { 
    businessId: businessId,
    status: 'active' 
});
```

#### create(collection, data)
Insert a new document.

```javascript
const { Business } = require('./db/models/Business.model');

const newBusiness = new Business({
    name: "Test Business",
    // ... other fields
});
await DbService.create(COLLECTIONS.BUSINESSES, newBusiness);
```

#### update(collection, filter, data)
Update a single document (uses `$set`).

```javascript
await DbService.update(
    COLLECTIONS.BUSINESSES, 
    { _id: businessId }, 
    { status: 'inactive', description: 'Updated description' }
);
```

#### updateMany(collection, filter, data)
Update multiple documents.

```javascript
// Deactivate all services for a business
await DbService.updateMany(
    COLLECTIONS.SERVICES, 
    { businessId: businessId }, 
    { status: 'inactive' }
);
```

#### delete(collection, filter)
Delete a single document.

```javascript
await DbService.delete(COLLECTIONS.EVENTS, { teamupEventId: "evt_123" });
```

#### deleteMany(collection, filter)
Delete multiple documents.

```javascript
// Delete all events for a calendar
await DbService.deleteMany(COLLECTIONS.EVENTS, { calendarId: calendarId });
```

#### pushUpdate(collection, filter, data)
Add item to an array field.

```javascript
// Add a service to an employee
await DbService.pushUpdate(
    COLLECTIONS.EMPLOYEES, 
    { _id: employeeId }, 
    { services: newServiceId }
);
```

#### pullUpdate(collection, filter, data)
Remove item from an array field.

```javascript
// Remove a service from an employee
await DbService.pullUpdate(
    COLLECTIONS.EMPLOYEES, 
    { _id: employeeId }, 
    { services: serviceId }
);
```

#### getManyWithSort(collection, filter, sort)
Get documents with sorting.

```javascript
// Get services sorted by price (ascending)
const services = await DbService.getManyWithSort(
    COLLECTIONS.SERVICES, 
    { businessId: businessId }, 
    { price: 1 }
);
```

#### getManyWithLimit(collection, filter, limit)
Get limited number of documents.

```javascript
// Get first 10 events
const events = await DbService.getManyWithLimit(
    COLLECTIONS.EVENTS, 
    { calendarId: calendarId }, 
    10
);
```

### Valid Collections

The service validates collection names against the global COLLECTIONS constant:

```javascript
const COLLECTIONS = {
    CALENDARS: "calendars",
    EVENTS: "events",
    EMPLOYEES: "employees",
    LOCATIONS: "locations",
    SERVICES: "services",
    BUSINESSES: "businesses",
    PERSONAL_DATA: "personalData",
    NOTICES: "notices"
};
```

---

## CalendarService

Handles calendar synchronization and time slot calculations.

### Location
`services/calendar.service.js`

### Methods

#### syncAllCalendars()
Synchronize all calendars with Teamup. Called on server startup.

```javascript
const CalendarService = require('./services/calendar.service');

// Usually called automatically on startup
await CalendarService.syncAllCalendars();
```

**What it does:**
1. Fetches all calendars from database
2. For each calendar:
   - Sets status to 'inactive'
   - Fetches events from Teamup since last sync
   - Updates local events (delete old, create new)
   - Removes orphaned events
   - Sets status back to 'active'

#### syncCalendar(calendarId)
Synchronize a single calendar.

```javascript
await CalendarService.syncCalendar(calendarId);
```

**Use case:** Called after webhook notifications about recurring event changes.

#### getAvailableTimeSlotsForService(businessId, timeSlotsDuration, teamupSubCalendarId)
Calculate available booking slots.

```javascript
// Get 30-minute slots for a specific employee
const availableSlots = await CalendarService.getAvailableTimeSlotsForService(
    businessId,
    30,  // duration in minutes
    12345  // employee's teamup sub-calendar ID
);

// Returns:
[
    { start: "2024-01-15T09:00:00Z", end: "2024-01-15T09:30:00Z" },
    { start: "2024-01-15T09:30:00Z", end: "2024-01-15T10:00:00Z" },
    // ...
]
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `businessId` | ObjectId | Business to get slots for |
| `timeSlotsDuration` | Number | Service duration in minutes |
| `teamupSubCalendarId` | Number | Optional - Filter by specific employee's calendar |

**Algorithm:**
1. Gets business config (slotTime, maxDays, minSlots)
2. Gets location working hours
3. Gets existing events from database
4. Iterates through each day in the booking window
5. For each working hour range:
   - Generates time slots
   - Filters out slots that overlap with existing events
   - Filters out slots before minimum advance time

#### checkTimeSlotValidityAndAvailability(calendarId, startDt, endDt, teamupSubCalendarId)
Verify a specific time slot is bookable.

```javascript
const isAvailable = await CalendarService.checkTimeSlotValidityAndAvailability(
    calendarId,
    "2024-01-15T10:00:00Z",
    "2024-01-15T10:30:00Z",
    12345
);

if (!isAvailable) {
    throw new Error("Time slot not available");
}
```

**Returns:** `true` if slot is available, `false` or `null` otherwise.

---

## TeamupService

Integration with Teamup calendar API.

### Location
`services/teamup.service.js`

### Methods

#### getCalendarConfiguration(teamupSecretCalendarKey, teamupApiKey)
Fetch calendar configuration from Teamup.

```javascript
const TeamupService = require('./services/teamup.service');

const config = await TeamupService.getCalendarConfiguration(
    "ks123abc",  // Secret calendar key
    "abc123xyz"  // API key
);

// Returns:
{
    date_time: { tz: "Europe/Sofia" },
    subcalendars: [
        { id: 12345, name: "John's Calendar" },
        { id: 12346, name: "Jane's Calendar" }
    ]
    // ... other config
}
```

#### getInitialEvents(teamupSecretCalendarKey, teamupApiKey, startDate, resultsSchema)
Fetch events from a date forward (3 months window).

```javascript
const events = await TeamupService.getInitialEvents(
    "ks123abc",
    "abc123xyz",
    "2024-01-01T00:00:00Z"
);

// Returns array of Teamup event objects
[
    {
        id: "evt_123",
        subcalendar_ids: [12345],
        all_day: false,
        rrule: null,
        start_dt: "2024-01-15T10:00:00Z",
        end_dt: "2024-01-15T10:30:00Z",
        deleted_dt: null
    }
]
```

**Optional resultsSchema:** Transform function for custom output format.

```javascript
const events = await TeamupService.getInitialEvents(
    key, apiKey, startDate,
    (event) => ({ id: event.id, start: event.start_dt })
);
```

#### createEvent(teamupSecretCalendarKey, teamupApiKey, subcalendarIds, title, description, startDt, endDt, resultsSchema)
Create a new event in Teamup.

```javascript
const newEvent = await TeamupService.createEvent(
    "ks123abc",
    "abc123xyz",
    [12345],                              // Sub-calendar IDs
    "John Doe - Haircut",                 // Title
    "<p>Email: john@example.com</p>",     // Description (HTML)
    "2024-01-15T10:00:00Z",              // Start
    "2024-01-15T10:30:00Z"               // End
);

// Returns:
{
    id: "evt_abc123",
    // ... full event object
}
```

#### getModifiedEvents(teamupSecretCalendarKey, teamupApiKey, lastSynchronizedDt)
Get events modified since a specific date.

```javascript
const modifiedEvents = await TeamupService.getModifiedEvents(
    "ks123abc",
    "abc123xyz",
    "2024-01-15T10:00:00Z"
);
```

---

## EmailService

Send email notifications via SMTP.

### Location
`services/email.service.js`

### Methods

#### sendEmail(business, email, subject, message)
Send an email using the business's configured sender.

```javascript
const EmailService = require('./services/email.service');

const result = await EmailService.sendEmail(
    business,                          // Business object (must have senderEmail, senderPassword)
    "customer@example.com",            // Recipient
    "Appointment Confirmation",        // Subject
    "Your appointment is confirmed..." // Message (can include HTML)
);

// Returns:
{ success: true, message: 'Email sent successfully!' }
// or
{ success: false, message: 'Failed to send email.', error: {...} }
```

**Requirements:**
- Business must have `isEmailSender: true`
- Business must have valid `senderEmail` (Gmail address)
- Business must have valid `senderPassword` (encrypted Gmail app password)

**Email Template:**
The service wraps the message in a styled HTML template including:
- Main message content
- Business contact information
- "Powered by sitezup.com" footer

### Configuration

The service uses Gmail SMTP:
```javascript
{
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: business.senderEmail,
        pass: decryptedPassword  // Decrypted using CryptoService
    }
}
```

**Important:** Use Gmail App Passwords, not regular passwords.

---

## CryptoService

Encryption and decryption for sensitive data.

### Location
`services/crypto.service.js`

### Methods

#### hash(payload)
Encrypt a string using AES-256-CBC.

```javascript
const CryptoService = require('./services/crypto.service');

const encrypted = CryptoService.hash("my-secret-password");
// Returns: "iv_hex_string:encrypted_hex_string"
// Example: "a1b2c3d4e5f6...:9f8e7d6c5b4a..."
```

**How it works:**
1. Derives a 32-byte key from `CRYPTO_KEY` environment variable
2. Generates a random 16-byte IV
3. Encrypts using AES-256-CBC
4. Returns `IV:ciphertext` (both in hex)

#### unhash(hash)
Decrypt a previously encrypted string.

```javascript
const password = CryptoService.unhash("a1b2c3d4e5f6...:9f8e7d6c5b4a...");
// Returns: "my-secret-password"
```

**Use case:** Email sender passwords are stored encrypted and decrypted when sending emails.

---

## AuthenticationService

JWT token management and password hashing.

### Location
`services/authentication.service.js`

### Methods

#### generateToken(meta)
Create a JWT token with custom payload.

```javascript
const AuthenticationService = require('./services/authentication.service');

const token = AuthenticationService.generateToken({
    userId: "507f1f77bcf86cd799439011",
    role: "admin"
});
// Returns: "eyJhbGciOiJIUzI1NiIs..."
```

#### verifyToken(token)
Verify and decode a JWT token.

```javascript
try {
    const decoded = AuthenticationService.verifyToken(token);
    console.log(decoded.userId);  // "507f1f77bcf86cd799439011"
} catch (error) {
    console.log("Invalid token");
}
```

#### hashPassword(password)
Hash a password using bcrypt (for storage).

```javascript
const hashedPassword = AuthenticationService.hashPassword("user-password");
// Returns: "$2b$10$..."
```

**Note:** Uses bcrypt with salt rounds of 10.

#### verifyPassword(password, hash)
Check if a password matches a hash.

```javascript
const isValid = AuthenticationService.verifyPassword(
    "user-password",
    "$2b$10$..."
);
// Returns: true or false
```

---

## Service Dependencies

```
                    ┌─────────────────────┐
                    │   Routes/Handlers   │
                    └──────────┬──────────┘
                               │
           ┌───────────────────┼───────────────────┐
           ▼                   ▼                   ▼
   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐
   │  DbService    │   │CalendarService│   │  EmailService │
   └───────────────┘   └───────┬───────┘   └───────┬───────┘
           ▲                   │                   │
           │           ┌───────┴───────┐           │
           │           ▼               │           │
           │   ┌───────────────┐       │           │
           │   │ TeamupService │       │           ▼
           │   └───────────────┘       │   ┌───────────────┐
           │                           │   │ CryptoService │
           └───────────────────────────┘   └───────────────┘

   ┌───────────────────────┐
   │AuthenticationService  │ (standalone, used by middleware)
   └───────────────────────┘
```

---

## Creating a New Service

Follow this pattern when adding new services:

```javascript
// services/my-new.service.js

const MyNewService = {
    /**
     * Method description
     * @param {string} param1 - Description
     * @returns {Promise<Object>} Description of return value
     */
    async myMethod(param1) {
        try {
            // Implementation
            return result;
        } catch (error) {
            console.error(error);
            return null;  // or throw, depending on use case
        }
    },
    
    anotherMethod() {
        // Synchronous methods are also fine
    }
};

module.exports = MyNewService;
```

**Guidelines:**
1. Use object literal pattern (like existing services)
2. Handle errors appropriately (return null or throw ResponseError)
3. Keep methods focused on single responsibility
4. Document complex logic with comments

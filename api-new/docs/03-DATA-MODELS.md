# Data Models

This document describes all database models, their fields, relationships, and usage patterns.

## Entity Relationship Diagram

```
┌─────────────────┐
│    Business     │
│    (tenant)     │
└────────┬────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐
│    Calendar     │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│     Event       │
└─────────────────┘

┌─────────────────┐      ┌─────────────────┐
│    Business     │──1:N─│    Service      │
└────────┬────────┘      └────────┬────────┘
         │                        │
         │ 1:N                    │ N:M
         ▼                        │
┌─────────────────┐              │
│    Employee     │◀─────────────┘
└────────┬────────┘
         │
         │ N:M
         ▼
┌─────────────────┐
│    Location     │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    Notice       │
└─────────────────┘

┌─────────────────┐
│  PersonalData   │ (standalone - customer info)
└─────────────────┘
```

## Business Model

The central entity representing a tenant in the system.

### Schema Definition

```javascript
const businessSchema = {
    name: String,              // Required - Display name
    description: String,       // Optional - Business description
    logo: String,              // Optional - URL to logo image
    phone: String,             // Optional - Contact phone
    email: String,             // Optional - Contact email
    isEmailSender: Boolean,    // Default: false - Can send emails
    senderEmail: String,       // Required if isEmailSender - Gmail address
    senderPassword: String,    // Required if isEmailSender - Encrypted
    website: String,           // Optional, unique - Business website URL
    socialMedia: Object,       // Optional - Social media links
    URLpostfix: String,        // Required - URL-safe identifier
    slotTime: Number,          // Required - Base time slot in minutes
    maximumDaysInFuture: Number, // Required - How far ahead to book
    minimumTimeSlotsInFuture: Number, // Required - Minimum advance booking
    status: String             // Required - 'active'|'inactive'|'deleted'
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | The business display name (e.g., "Joe's Barbershop") |
| `description` | String | No | A brief description of the business |
| `logo` | String | No | URL to the business logo |
| `phone` | String | No | Contact phone number |
| `email` | String | No | Contact email address |
| `isEmailSender` | Boolean | No | Whether the business sends confirmation emails |
| `senderEmail` | String | Conditional | Gmail address for sending emails (required if `isEmailSender`) |
| `senderPassword` | String | Conditional | Encrypted Gmail app password (required if `isEmailSender`) |
| `website` | String | No | Business website URL (must be unique) |
| `socialMedia` | Object | No | Social media profile URLs |
| `URLpostfix` | String | Yes | URL-safe identifier for routing (e.g., "joes-barbershop") |
| `slotTime` | Number | Yes | Base time slot duration in minutes (e.g., 15, 30) |
| `maximumDaysInFuture` | Number | Yes | Maximum days in advance customers can book (1-60) |
| `minimumTimeSlotsInFuture` | Number | Yes | Minimum slots before appointment can start |
| `status` | String | Yes | Current status: 'active', 'inactive', or 'deleted' |

### Example Document

```json
{
    "_id": "507f1f77bcf86cd799439011",
    "name": "Elegant Hair Studio",
    "description": "Premium hair styling services",
    "logo": "https://example.com/logo.png",
    "phone": "+1234567890",
    "email": "contact@eleganthair.com",
    "isEmailSender": true,
    "senderEmail": "noreply@eleganthair.com",
    "senderPassword": "abc123:encrypted_password_here",
    "website": "https://eleganthair.com",
    "socialMedia": {
        "facebook": "https://facebook.com/eleganthair",
        "instagram": "https://instagram.com/eleganthair"
    },
    "URLpostfix": "elegant-hair",
    "slotTime": 15,
    "maximumDaysInFuture": 30,
    "minimumTimeSlotsInFuture": 4,
    "status": "active"
}
```

### Understanding Time Slots

The `slotTime` field is the base unit for all time calculations:

```
If slotTime = 15 minutes:

Service: "Quick Trim" with timeSlots = 1 → 15 minutes
Service: "Full Haircut" with timeSlots = 2 → 30 minutes
Service: "Color Treatment" with timeSlots = 6 → 90 minutes

minimumTimeSlotsInFuture = 4 means customers must book
at least 4 × 15 = 60 minutes in advance
```

---

## Calendar Model

Stores calendar configuration and integration credentials.

### Schema Definition

```javascript
const calendarSchema = {
    businessId: ObjectId,      // Required, unique - Reference to Business
    integration: String,       // Optional - Integration type (e.g., 'TEAMUP')
    teamupApiKey: String,      // Conditional - Teamup API key
    teamupSecretCalendarKey: String, // Conditional - Teamup calendar key
    timezone: String,          // Required - IANA timezone
    teamupSubCalendarIds: [{   // Array - Sub-calendar mappings
        id: Number,
        name: String
    }],
    lastSynchronized: Date,    // Optional - Last sync timestamp
    status: String             // Required - 'active'|'inactive'|'deleted'
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `businessId` | ObjectId | Yes | Reference to the parent Business (unique per business) |
| `integration` | String | No | Calendar integration type (currently only 'TEAMUP') |
| `teamupApiKey` | String | Conditional | API key for Teamup (required for TEAMUP integration) |
| `teamupSecretCalendarKey` | String | Conditional | Secret calendar key for Teamup |
| `timezone` | String | Yes | IANA timezone (e.g., 'Europe/Sofia', 'America/New_York') |
| `teamupSubCalendarIds` | Array | No | Mapping of Teamup sub-calendars to names |
| `lastSynchronized` | Date | No | Timestamp of last successful sync |
| `status` | String | Yes | Current status |

### Example Document

```json
{
    "_id": "507f1f77bcf86cd799439012",
    "businessId": "507f1f77bcf86cd799439011",
    "integration": "TEAMUP",
    "teamupApiKey": "abc123xyz",
    "teamupSecretCalendarKey": "ks123abc",
    "timezone": "Europe/Sofia",
    "teamupSubCalendarIds": [
        { "id": 12345, "name": "John's Calendar" },
        { "id": 12346, "name": "Jane's Calendar" }
    ],
    "lastSynchronized": "2024-01-15T10:30:00.000Z",
    "status": "active"
}
```

---

## Employee Model

Represents staff members who provide services.

### Schema Definition

```javascript
const employeeSchema = {
    name: String,              // Required - Employee name
    teamupSubCalendarId: Number, // Optional - Teamup sub-calendar ID
    businessId: ObjectId,      // Required - Reference to Business
    services: [ObjectId],      // Array - Services this employee offers
    status: String             // Required - 'active'|'inactive'|'deleted'
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Employee display name |
| `teamupSubCalendarId` | Number | No | Corresponding Teamup sub-calendar ID |
| `businessId` | ObjectId | Yes | Reference to parent Business |
| `services` | [ObjectId] | No | Array of Service IDs this employee can provide |
| `status` | String | Yes | Current status |

### Example Document

```json
{
    "_id": "507f1f77bcf86cd799439013",
    "name": "John Stylist",
    "teamupSubCalendarId": 12345,
    "businessId": "507f1f77bcf86cd799439011",
    "services": [
        "507f1f77bcf86cd799439020",
        "507f1f77bcf86cd799439021"
    ],
    "status": "active"
}
```

### Relationship: Employee ↔ Services

This is a many-to-many relationship:
- One employee can offer multiple services
- One service can be offered by multiple employees

```
Employee "John"           Employee "Jane"
├── Haircut              ├── Haircut
├── Styling              ├── Coloring
└── Beard Trim           └── Highlights
```

---

## Service Model

Represents services offered by the business.

### Schema Definition

```javascript
const serviceSchema = {
    name: String,              // Required - Service name
    price: Number,             // Required - Price value
    priceEur: String,          // Required - Price in EUR (display format)
    currency: String,          // Required - Currency code (e.g., 'EUR')
    timeSlots: Number,         // Required - Number of base time slots
    businessId: ObjectId,      // Required - Reference to Business
    status: String             // Required - 'active'|'inactive'|'deleted'
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Service name (e.g., "Haircut", "Massage") |
| `price` | Number | Yes | Numeric price value |
| `priceEur` | String | Yes | Formatted price in EUR for display |
| `currency` | String | Yes | 3-letter currency code |
| `timeSlots` | Number | Yes | How many base slots this service takes (1-24) |
| `businessId` | ObjectId | Yes | Reference to parent Business |
| `status` | String | Yes | Current status |

### Example Document

```json
{
    "_id": "507f1f77bcf86cd799439020",
    "name": "Full Haircut",
    "price": 25,
    "priceEur": "25.00",
    "currency": "EUR",
    "timeSlots": 2,
    "businessId": "507f1f77bcf86cd799439011",
    "status": "active"
}
```

### Duration Calculation

```
Service Duration = timeSlots × Business.slotTime

Example:
- Business slotTime = 15 minutes
- Service timeSlots = 2
- Actual duration = 30 minutes
```

---

## Event Model

Represents booked appointments and calendar events.

### Schema Definition

```javascript
const eventSchema = {
    calendarId: ObjectId,      // Required - Reference to Calendar
    teamupSubCalendarIds: [Number], // Required - Teamup sub-calendar IDs
    allDay: Boolean,           // Default: false - Is this an all-day event
    rrule: String,             // Optional - Recurrence rule
    teamupEventId: String,     // Required - Teamup event identifier
    start: Date,               // Required - Start timestamp
    end: Date                  // Required - End timestamp
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `calendarId` | ObjectId | Yes | Reference to Calendar |
| `teamupSubCalendarIds` | [Number] | Yes | Array of Teamup sub-calendar IDs |
| `allDay` | Boolean | No | Whether this is an all-day event (blocks entire day) |
| `rrule` | String | No | Recurrence rule (RFC 5545 format) |
| `teamupEventId` | String | Yes | Unique identifier from Teamup |
| `start` | Date | Yes | Event start time (ISO format) |
| `end` | Date | Yes | Event end time (ISO format) |

### Example Document

```json
{
    "_id": "507f1f77bcf86cd799439030",
    "calendarId": "507f1f77bcf86cd799439012",
    "teamupSubCalendarIds": [12345],
    "allDay": false,
    "teamupEventId": "evt_abc123",
    "start": "2024-01-15T10:00:00.000Z",
    "end": "2024-01-15T10:30:00.000Z"
}
```

### Recurrence Rules

For recurring events, the `rrule` field contains an RFC 5545 recurrence rule:

```
FREQ=WEEKLY;BYDAY=MO,WE,FR  → Every Monday, Wednesday, Friday
FREQ=DAILY;INTERVAL=2       → Every 2 days
FREQ=MONTHLY;BYMONTHDAY=1   → First of every month
```

---

## Location Model

Represents physical business locations.

### Schema Definition

```javascript
const locationSchema = {
    name: String,              // Required - Location name
    addressName: String,       // Required - Human-readable address
    lat: Number,               // Required - Latitude (-90 to 90)
    lon: Number,               // Required - Longitude (-180 to 180)
    phone: String,             // Required - Location phone number
    businessId: ObjectId,      // Required - Reference to Business
    employees: [ObjectId],     // Array - Employees at this location
    workingHours: [{           // Array - Working hours by day
        day: String,           // Day of week
        open: String,          // Opening time (HH:mm)
        close: String          // Closing time (HH:mm)
    }],
    status: String             // Required - 'active'|'inactive'|'deleted'
}
```

### Field Details

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Location display name |
| `addressName` | String | Yes | Street address |
| `lat` | Number | Yes | Latitude coordinate |
| `lon` | Number | Yes | Longitude coordinate |
| `phone` | String | Yes | Location contact phone |
| `businessId` | ObjectId | Yes | Reference to parent Business |
| `employees` | [ObjectId] | No | Array of Employee IDs at this location |
| `workingHours` | Array | No | Array of working hour objects |
| `status` | String | Yes | Current status |

### Working Hours Structure

The `workingHours` array can have multiple entries per day (for lunch breaks, etc.):

```json
{
    "workingHours": [
        { "day": "monday", "open": "09:00", "close": "12:30" },
        { "day": "monday", "open": "14:00", "close": "18:00" },
        { "day": "tuesday", "open": "09:00", "close": "18:00" }
    ]
}
```

**Note:** Days not listed are considered closed.

### Example Document

```json
{
    "_id": "507f1f77bcf86cd799439040",
    "name": "Downtown Branch",
    "addressName": "123 Main Street, City Center",
    "lat": 42.6977,
    "lon": 23.3219,
    "phone": "+1234567890",
    "businessId": "507f1f77bcf86cd799439011",
    "employees": [
        "507f1f77bcf86cd799439013",
        "507f1f77bcf86cd799439014"
    ],
    "workingHours": [
        { "day": "monday", "open": "09:00", "close": "18:00" },
        { "day": "tuesday", "open": "09:00", "close": "18:00" },
        { "day": "wednesday", "open": "09:00", "close": "18:00" },
        { "day": "thursday", "open": "09:00", "close": "18:00" },
        { "day": "friday", "open": "09:00", "close": "17:00" },
        { "day": "saturday", "open": "10:00", "close": "14:00" }
    ],
    "status": "active"
}
```

---

## Notice Model

Stores notifications/notes for employees.

### Schema Definition

```javascript
const noticeSchema = {
    employeeId: ObjectId,      // Required - Reference to Employee
    message: String            // Required - Notice content
}
```

### Example Document

```json
{
    "_id": "507f1f77bcf86cd799439050",
    "employeeId": "507f1f77bcf86cd799439013",
    "message": "Remember to confirm the 3pm appointment"
}
```

---

## PersonalData Model

Stores customer contact information from bookings.

### Schema Definition

```javascript
const personalDataSchema = {
    email: String,             // Optional - Customer email
    phone: String,             // Optional - Customer phone
    name: String               // Optional - Customer name
}
```

### Example Document

```json
{
    "_id": "507f1f77bcf86cd799439060",
    "email": "customer@example.com",
    "phone": "+1234567890",
    "name": "John Customer"
}
```

**Privacy Note:** This data is collected during booking for confirmation emails. Ensure compliance with data protection regulations (GDPR, etc.).

---

## Status Values

All main entities use a consistent status system:

| Status | Description |
|--------|-------------|
| `active` | Entity is active and operational |
| `inactive` | Entity exists but is temporarily disabled |
| `deleted` | Soft delete - entity is hidden but data preserved |

### Soft Delete Pattern

The system uses soft deletes (`status: 'deleted'`) instead of actually removing documents:

```javascript
// Query patterns
{ status: 'active' }           // Get active only
{ status: { $ne: 'deleted' } } // Get active and inactive
// Never returned: deleted items
```

---

## Indexes and Performance

### Recommended Indexes

```javascript
// Business - lookup by website domain
db.businesses.createIndex({ website: 1 }, { unique: true });

// Calendar - unique per business
db.calendars.createIndex({ businessId: 1 }, { unique: true });

// Events - query by calendar and time range
db.events.createIndex({ calendarId: 1, start: 1, end: 1 });

// Employees - lookup by business and sub-calendar
db.employees.createIndex({ businessId: 1 });
db.employees.createIndex({ teamupSubCalendarId: 1 });

// Locations - lookup by business
db.locations.createIndex({ businessId: 1 });

// Services - lookup by business
db.services.createIndex({ businessId: 1 });
```

---

## Data Validation Summary

| Model | Key Validations |
|-------|-----------------|
| Business | `slotTime`: 1-1440, `maximumDaysInFuture`: 1-60 |
| Service | `timeSlots`: 1-24, `price`: ≥0 |
| Employee | `services` must belong to same business |
| Location | `lat`: -90 to 90, `lon`: -180 to 180 |
| Event | `start` < `end`, valid calendar reference |

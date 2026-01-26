# Glossary

Quick reference for terms, concepts, and acronyms used in this API.

## A

### Active Status
An entity state indicating it's currently operational and visible. One of three possible statuses: `active`, `inactive`, `deleted`.

### Admin Password
A simple authentication mechanism using the `admin_password` HTTP header to protect administrative endpoints.

### All-Day Event
A calendar event that spans an entire day, blocking all time slots. Stored in the `allDay` field of Event model.

### API Key (Teamup)
Authentication credential for Teamup API access. Stored in Calendar model as `teamupApiKey`.

## B

### Base Slot
See [Slot Time](#slot-time).

### bcrypt
A password-hashing library used for securely storing passwords. Used in AuthenticationService.

### Business
The top-level tenant entity in the system. A business can have multiple services, employees, locations, and one calendar.

### Business ID
MongoDB ObjectId that uniquely identifies a business. Used as a foreign key in related models.

## C

### Calendar
Configuration entity linking a business to an external calendar (currently Teamup). One calendar per business.

### Calendar Service
Internal service (`calendar.service.js`) handling time slot calculations and calendar synchronization.

### Collection
MongoDB's term for a table. Examples: `businesses`, `employees`, `events`.

### Conflict (409)
HTTP status code indicating the request conflicts with current state (e.g., entity is inactive, time slot unavailable).

### CORS
Cross-Origin Resource Sharing. Enabled by default to allow requests from any origin.

### CRUD
Create, Read, Update, Delete - basic database operations.

### Crypto Service
Internal service (`crypto.service.js`) for AES-256-CBC encryption/decryption of sensitive data.

## D

### Deleted Status
Soft-delete state. Entity is hidden but data preserved. Never physically removes data.

### DbService
Database abstraction layer (`db.service.js`) providing standardized MongoDB operations.

### Document
MongoDB's term for a row/record. JSON-like structure stored in collections.

## E

### Employee
Staff member who provides services. Linked to a Teamup sub-calendar for scheduling.

### Event
A booked appointment or blocked time in the calendar. Created both locally and in Teamup.

### Express
Node.js web framework used to build this API.

## F

### Filter
MongoDB query object used to match documents. Example: `{ status: 'active' }`.

## G

### Gmail App Password
Special password for SMTP access when 2FA is enabled. Required for email sending.

## H

### Hapi/Joi
Validation library used for request body validation. Provides declarative schema definitions.

### HMAC-SHA256
Hash-based Message Authentication Code using SHA-256. Used to verify Teamup webhook signatures.

### HTTP Status Codes
Standard response codes. See [Status Codes](#status-codes-reference).

## I

### IANA Timezone
Standard timezone identifier (e.g., `Europe/Sofia`, `America/New_York`). Used for time calculations.

### Inactive Status
Entity state indicating temporary suspension. Still exists but won't appear in public queries.

### Integration
External service connection. Currently only `TEAMUP` is supported.

## J

### JWT
JSON Web Token. Used for generating authentication tokens (though admin auth currently uses simple password).

## L

### Location
Physical place where services are offered. Contains working hours and assigned employees.

### Logger
Winston-based logging system. Outputs to console (dev) or file (prod).

## M

### Maximum Days in Future
Business setting (`maximumDaysInFuture`) controlling how far ahead customers can book (1-60 days).

### Middleware
Express functions that process requests before route handlers. Examples: CORS, rate limiting, admin auth.

### Minimum Time Slots in Future
Business setting (`minimumTimeSlotsInFuture`) requiring minimum advance booking time.

### Mongoose
MongoDB ODM (Object Document Mapper) library for schema definition and database operations.

### Multi-tenant
Architecture supporting multiple independent businesses on shared infrastructure.

## N

### Notice
Notification or message for an employee.

### Nodemailer
Node.js library for sending emails via SMTP.

## O

### ObjectId
MongoDB's unique identifier type. 24-character hexadecimal string.

### ODM
Object Document Mapper. Mongoose is the ODM used in this project.

## P

### Personal Data
Customer information (name, email, phone) stored during booking for confirmations.

### Price EUR
Service price displayed in EUR format for consistency.

### Production
Environment mode (`ENVIRONMENT=PRODUCTION`) with file logging and reduced verbosity.

## R

### Rate Limiting
Request throttling (100 requests per 15 minutes per IP) to prevent abuse.

### ResponseError
Custom error class including HTTP status code for proper error responses.

### rrule
Recurrence Rule. RFC 5545 format string for recurring events (e.g., `FREQ=WEEKLY;BYDAY=MO`).

## S

### Schema
Definition of document structure (fields, types, validations) in Mongoose.

### Secret Calendar Key
Teamup-specific identifier (`teamupSecretCalendarKey`) for calendar access.

### Service
Offering provided by a business (e.g., "Haircut", "Massage"). Has duration and price.

### Slot Time
Base time unit in minutes for a business (`slotTime`). All service durations are multiples of this.

### SMTP
Simple Mail Transfer Protocol. Used for sending emails via Gmail.

### Soft Delete
Marking records as `deleted` instead of physically removing them. Preserves data integrity.

### Status
Entity state field with values: `active`, `inactive`, or `deleted`.

### Sub-calendar
Teamup concept - individual calendars within a main calendar. Each employee has one.

### Synchronization
Process of matching local event data with external Teamup calendar.

## T

### Teamup
External calendar service integrated for appointment management.

### Teamup Event ID
Unique identifier for events in Teamup (`teamupEventId`). Used for sync tracking.

### Tenant
See [Business](#business). Multi-tenancy refers to multiple businesses sharing infrastructure.

### Time Slot
Available booking window. Duration determined by service requirements.

### Time Slots (Service)
Number of base slots a service requires. Actual duration = `timeSlots × slotTime`.

### Timezone
IANA timezone string used for date/time calculations. Stored per calendar.

### TLD
Top-Level Domain. Used in business lookup by website.

## U

### URL Postfix
URL-safe identifier for a business (`URLpostfix`). Pattern: `^[a-zA-Z0-9-_]+$`.

## V

### Validation
Request body verification using Joi schemas before processing.

## W

### Webhook
HTTP callback from Teamup notifying of calendar changes (event created/modified/removed).

### Winston
Logging library providing structured, configurable logging.

### Working Hours
Operating hours for a location. Array of day/open/close objects.

---

## Status Codes Reference

| Code | Name | Common Use |
|------|------|------------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation failed |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Business rule violation |
| 500 | Internal Server Error | Unexpected failure |

---

## Acronyms

| Acronym | Meaning |
|---------|---------|
| API | Application Programming Interface |
| CORS | Cross-Origin Resource Sharing |
| CRUD | Create, Read, Update, Delete |
| DB | Database |
| ENV | Environment (variables) |
| HMAC | Hash-based Message Authentication Code |
| HTTP | Hypertext Transfer Protocol |
| IANA | Internet Assigned Numbers Authority |
| JSON | JavaScript Object Notation |
| JWT | JSON Web Token |
| ODM | Object Document Mapper |
| RFC | Request for Comments (standard) |
| SMTP | Simple Mail Transfer Protocol |
| TLD | Top-Level Domain |
| URI | Uniform Resource Identifier |
| URL | Uniform Resource Locator |

---

## Quick Calculations

### Service Duration
```
duration_minutes = service.timeSlots × business.slotTime
```

### Minimum Booking Time
```
earliest_booking = now + (business.minimumTimeSlotsInFuture × business.slotTime) minutes
```

### Booking Window
```
latest_booking = now + business.maximumDaysInFuture days
```

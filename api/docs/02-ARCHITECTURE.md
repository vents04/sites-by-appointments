# Architecture

This document explains the overall system architecture, how components interact, and the design decisions behind the API.

## System Overview

The API follows a **layered architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│              (Web App, Mobile App, Admin Tools)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Express Server                          │
│                        (api.js)                              │
├─────────────────────────────────────────────────────────────┤
│  Middleware Layer                                            │
│  ├── CORS                                                    │
│  ├── Rate Limiting                                           │
│  ├── JSON Body Parser                                        │
│  └── Admin Authentication                                    │
├─────────────────────────────────────────────────────────────┤
│  Route Layer                                                 │
│  ├── /business    → business.route.js                        │
│  ├── /calendar    → calendar.route.js                        │
│  ├── /employee    → employee.route.js                        │
│  ├── /event       → event.route.js                           │
│  ├── /location    → location.route.js                        │
│  ├── /notice      → notice.route.js                          │
│  ├── /service     → service.route.js                         │
│  └── /webhook     → webhook.route.js                         │
├─────────────────────────────────────────────────────────────┤
│  Validation Layer                                            │
│  └── Hapi/Joi Schemas (validation/hapi.js)                   │
├─────────────────────────────────────────────────────────────┤
│  Service Layer (Business Logic)                              │
│  ├── CalendarService    → Time slot calculations             │
│  ├── DbService          → Database operations                │
│  ├── TeamupService      → External calendar API              │
│  ├── EmailService       → Email notifications                │
│  ├── CryptoService      → Encryption/decryption              │
│  └── AuthService        → JWT & password handling            │
├─────────────────────────────────────────────────────────────┤
│  Data Access Layer                                           │
│  └── Mongoose Models                                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       MongoDB                                │
└─────────────────────────────────────────────────────────────┘
```

## Component Details

### Entry Point (api.js)

The main entry point initializes and configures the Express application:

```javascript
// Key responsibilities:
1. Load environment variables (dotenv)
2. Configure middleware (CORS, rate limiting, JSON parsing)
3. Mount routes
4. Connect to MongoDB
5. Start HTTP server
6. Initialize calendar synchronization
```

**Why this order matters:**
- `dotenv.config()` must run before accessing `process.env`
- Middleware must be mounted before routes
- Error handler must be the last middleware

### Route Layer

Routes handle HTTP requests and delegate to services:

```
┌──────────────────────────────────────────────────────────────┐
│                       Route Handler                           │
├──────────────────────────────────────────────────────────────┤
│  1. Extract parameters from request                          │
│  2. Validate request body (if applicable)                    │
│  3. Call service methods                                     │
│  4. Return response or pass error to handler                 │
└──────────────────────────────────────────────────────────────┘
```

**Route organization:**

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/business` | Business CRUD | POST/PUT: Admin |
| `/calendar` | Calendar management | POST/PUT: Admin |
| `/employee` | Employee CRUD | POST/PUT: Admin |
| `/event` | Appointment booking | POST: Public |
| `/location` | Location CRUD | POST/PUT: Admin |
| `/notice` | Employee notices | GET: Public |
| `/service` | Service CRUD | POST/PUT: Admin |
| `/webhook` | Teamup callbacks | Signature verified |

### Service Layer

Services contain the business logic and are the "brains" of the application:

```
┌─────────────────────────────────────────────────────────────┐
│                      Services                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  CalendarService                                             │
│  ├── syncAllCalendars()     Sync all calendars with Teamup  │
│  ├── syncCalendar()         Sync single calendar            │
│  ├── getAvailableTimeSlots() Calculate available slots      │
│  └── checkTimeSlotValidity() Validate booking time          │
│                                                              │
│  DbService                                                   │
│  ├── getOne(), getMany()    Read operations                 │
│  ├── create()               Create documents                │
│  ├── update(), updateMany() Update documents                │
│  └── delete(), deleteMany() Delete documents                │
│                                                              │
│  TeamupService                                               │
│  ├── getCalendarConfiguration() Get Teamup config           │
│  ├── getInitialEvents()     Fetch events                    │
│  ├── createEvent()          Create event in Teamup          │
│  └── getModifiedEvents()    Get changes since last sync     │
│                                                              │
│  EmailService                                                │
│  └── sendEmail()            Send confirmation emails        │
│                                                              │
│  CryptoService                                               │
│  ├── hash()                 Encrypt sensitive data          │
│  └── unhash()               Decrypt sensitive data          │
│                                                              │
│  AuthenticationService                                       │
│  ├── generateToken()        Create JWT tokens               │
│  ├── verifyToken()          Validate JWT tokens             │
│  ├── hashPassword()         Hash passwords (bcrypt)         │
│  └── verifyPassword()       Check passwords                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Access Layer

The data layer uses Mongoose for MongoDB interactions:

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Access                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  mongo.js                                                    │
│  ├── connect()     Establish MongoDB connection             │
│  └── disconnect()  Close connection                         │
│                                                              │
│  Models (Mongoose Schemas)                                   │
│  ├── Business      Multi-tenant business entity             │
│  ├── Calendar      Calendar configuration                   │
│  ├── Employee      Staff members                            │
│  ├── Event         Booked appointments                      │
│  ├── Location      Physical locations                       │
│  ├── Notice        Employee notifications                   │
│  ├── PersonalData  Customer information                     │
│  └── Service       Services offered                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## External Integrations

### Teamup Calendar Integration

The API integrates with Teamup for calendar management:

```
┌──────────┐     API Calls      ┌──────────────┐
│          │ ◀────────────────▶ │              │
│   API    │                    │   Teamup     │
│          │                    │   Calendar   │
│          │ ◀──────────────── │              │
└──────────┘     Webhooks       └──────────────┘
```

**Integration points:**

1. **Configuration Fetch** - Get calendar settings (timezone, subcalendars)
2. **Event Sync** - Pull events from Teamup to local database
3. **Event Creation** - Push new appointments to Teamup
4. **Webhooks** - Real-time updates when Teamup events change

### Email Integration (SMTP)

Emails are sent via Gmail SMTP:

```
┌──────────┐     SMTP      ┌──────────────┐     Delivery    ┌──────────┐
│   API    │ ────────────▶ │   Gmail      │ ──────────────▶ │ Customer │
│          │               │   SMTP       │                 │          │
└──────────┘               └──────────────┘                 └──────────┘
```

**Note:** Each business can have its own email credentials (encrypted in database).

## Request Flow

Here's how a typical request flows through the system:

### Example: Booking an Appointment

```
1. Client sends POST /event
   │
   ▼
2. Express receives request
   │
   ├── CORS check
   ├── Rate limit check
   └── Parse JSON body
   │
   ▼
3. Route handler (event.route.js)
   │
   ├── Validate request body (Joi)
   │
   ▼
4. Service calls
   │
   ├── DbService.getOne() - Get calendar
   ├── DbService.getById() - Get business
   ├── DbService.getById() - Get service
   ├── DbService.getById() - Get employee
   ├── CalendarService.checkTimeSlotValidity() - Verify slot
   ├── TeamupService.createEvent() - Create in Teamup
   ├── DbService.create() - Save to MongoDB
   └── EmailService.sendEmail() - Notify customer
   │
   ▼
5. Return response to client
```

## Multi-Tenancy Design

The API supports multiple businesses on the same instance:

```
┌─────────────────────────────────────────────────────────────┐
│                      Single API Instance                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Business A (Salon)                                         │
│   ├── Calendar A                                             │
│   ├── Services: Haircut, Coloring, Styling                  │
│   ├── Employees: John, Jane                                  │
│   └── Locations: Downtown, Uptown                           │
│                                                              │
│   Business B (Spa)                                           │
│   ├── Calendar B                                             │
│   ├── Services: Massage, Facial, Sauna                      │
│   ├── Employees: Mike, Sarah                                │
│   └── Locations: City Center                                │
│                                                              │
│   Business C (Clinic)                                        │
│   ├── Calendar C                                             │
│   ├── Services: Checkup, Consultation                       │
│   ├── Employees: Dr. Smith, Dr. Jones                       │
│   └── Locations: Medical Plaza                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Tenant isolation is enforced by:**
1. All queries filter by `businessId`
2. Routes validate that related entities belong to the same business
3. Each business has its own calendar credentials

## Security Architecture

### Authentication Layers

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Layers                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Rate Limiting                                      │
│  └── 100 requests per 15 minutes per IP                     │
│                                                              │
│  Layer 2: Admin Authentication                               │
│  └── admin_password header for protected endpoints          │
│                                                              │
│  Layer 3: Webhook Signature Verification                     │
│  └── HMAC-SHA256 signature for Teamup webhooks              │
│                                                              │
│  Layer 4: Data Encryption                                    │
│  └── AES-256-CBC for sensitive fields (email passwords)     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Sensitive Data Handling

| Data Type | Protection Method |
|-----------|-------------------|
| Email passwords | AES-256-CBC encryption |
| User passwords | bcrypt hashing |
| JWT tokens | HS256 signing |
| Webhook payloads | HMAC-SHA256 verification |

## Error Handling Flow

```
┌─────────────────┐
│ Error Occurs    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ResponseError   │ ◀── Custom error with status code
│ Created         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Error Handler   │ ◀── Catches all errors
│ Middleware      │
└────────┬────────┘
         │
         ├──────────────────────┐
         ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│ Log Error       │    │ Send Response   │
│ (Logger)        │    │ to Client       │
└─────────────────┘    └─────────────────┘
```

## Design Decisions

### Why MongoDB?

- **Flexible Schema**: Businesses may have varying requirements
- **Document Model**: Natural fit for nested data (working hours, subcalendars)
- **Scalability**: Horizontal scaling for growth

### Why Teamup Integration?

- **Existing Ecosystem**: Businesses often already use calendar tools
- **Two-way Sync**: Changes in either system are reflected
- **Real-time Updates**: Webhooks provide immediate synchronization

### Why Hapi/Joi for Validation?

- **Declarative**: Clear, readable validation rules
- **Comprehensive**: Handles complex validation scenarios
- **Error Messages**: Produces helpful error messages

### Why Separate Service Layer?

- **Testability**: Services can be unit tested independently
- **Reusability**: Logic can be shared across routes
- **Maintainability**: Clear separation of concerns

## Scaling Considerations

### Current Limitations

1. **Single Instance**: No load balancing configuration
2. **In-Memory Rate Limiting**: Doesn't work across multiple instances
3. **Synchronous Calendar Sync**: Blocks on startup

### Future Improvements

1. **Redis for Rate Limiting**: Distributed rate limiting
2. **Message Queue**: Async email and webhook processing
3. **Read Replicas**: Scale read operations
4. **Caching**: Cache frequently accessed data

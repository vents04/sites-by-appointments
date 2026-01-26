# API Documentation

Welcome to the Appointment Booking API documentation. This API powers a multi-tenant appointment booking system that integrates with Teamup calendars for schedule management.

## Quick Navigation

| Document | Description | Best For |
|----------|-------------|----------|
| [Getting Started](./01-GETTING-STARTED.md) | Setup, installation, and first steps | New developers |
| [Architecture](./02-ARCHITECTURE.md) | System design and component overview | Understanding the big picture |
| [Data Models](./03-DATA-MODELS.md) | Database schemas and relationships | Working with data |
| [API Endpoints](./04-API-ENDPOINTS.md) | Complete API reference | Integrating with the API |
| [Data Flows](./05-DATA-FLOWS.md) | How data moves through the system | Debugging and optimization |
| [Services](./06-SERVICES.md) | Business logic layer documentation | Extending functionality |
| [Error Handling](./07-ERROR-HANDLING.md) | Errors, logging, and troubleshooting | Debugging issues |
| [Glossary](./08-GLOSSARY.md) | Terms and concepts explained | Quick reference |

## What Does This API Do?

This API enables businesses to:

1. **Manage Appointments** - Customers can book time slots with specific employees for various services
2. **Sync with Teamup** - Two-way calendar synchronization with Teamup calendar service
3. **Send Notifications** - Automatic email confirmations to customers
4. **Multi-tenant Support** - Multiple businesses can use the same API instance

## High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Client    │────▶│   Express API   │────▶│    MongoDB      │
│   (Next.js)     │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Teamup API     │
                        │  (Calendar)     │
                        └─────────────────┘
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js | Server-side JavaScript |
| Framework | Express.js | HTTP server and routing |
| Database | MongoDB | Data persistence |
| ODM | Mongoose | MongoDB object modeling |
| Validation | Hapi/Joi | Request validation |
| Authentication | JWT + bcrypt | Token-based auth |
| Logging | Winston | Application logging |
| Email | Nodemailer | Email notifications |
| Calendar | Teamup API | External calendar integration |

## Key Concepts

### Business
A business is a tenant in the system (e.g., a hair salon, spa, or clinic). Each business has its own:
- Services (what they offer)
- Employees (who provides the services)
- Locations (where services are provided)
- Calendar configuration

### Time Slots
The system works with configurable time slots. A business defines:
- `slotTime` - Base duration in minutes (e.g., 15 minutes)
- Services have `timeSlots` - How many base slots a service takes

For example, if `slotTime = 15` and a haircut has `timeSlots = 2`, the haircut takes 30 minutes.

### Calendar Integration
The API synchronizes with Teamup calendars to:
- Fetch existing events (blocking times)
- Create new appointments
- Receive webhook updates for calendar changes

## Quick Start Example

Here's a typical flow for booking an appointment:

```javascript
// 1. Get business information
GET /business/example.com

// 2. Get available time slots
GET /event/available?calendarId=xxx&employeeId=yyy&serviceId=zzz

// 3. Book an appointment
POST /event
{
  "calendarId": "xxx",
  "employeeId": "yyy",
  "serviceId": "zzz",
  "startDt": "2024-01-15T10:00:00Z",
  "endDt": "2024-01-15T10:30:00Z",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "timezone": "Europe/Sofia"
}
```

## Need Help?

- **New to the project?** Start with [Getting Started](./01-GETTING-STARTED.md)
- **Understanding the system?** Read [Architecture](./02-ARCHITECTURE.md)
- **Building integrations?** Check [API Endpoints](./04-API-ENDPOINTS.md)
- **Debugging issues?** See [Error Handling](./07-ERROR-HANDLING.md)
- **Confused by a term?** Look in the [Glossary](./08-GLOSSARY.md)

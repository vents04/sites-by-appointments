# Architecture Overview

## 1. Introduction

This document describes the high-level architecture of the Sites By Appointments API - a multi-tenant SaaS platform for appointment booking. The system serves beauty salons and service-based businesses through a white-label mobile application.

## 2. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐          ┌─────────────────────────┐          │
│  │   Mobile App (React     │          │   Postman (Super Admin) │          │
│  │   Native / Expo)        │          │   Direct API Access     │          │
│  └───────────┬─────────────┘          └───────────┬─────────────┘          │
└──────────────┼────────────────────────────────────┼─────────────────────────┘
               │                                    │
               ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               API LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Express.js REST API                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Public Routes│  │ Business     │  │ Super Admin  │              │   │
│  │  │ (no auth)    │  │ Admin Routes │  │ Routes       │              │   │
│  │  │              │  │ (JWT)        │  │ (API Key)    │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Socket.io WebSocket Server                       │   │
│  │  Real-time updates for calendar events, bookings, notifications     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     Middleware Layer                                 │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │   │
│  │  │ JWT Auth │  │ i18n     │  │ Rate     │  │ Validation│           │   │
│  │  │          │  │          │  │ Limiting │  │ (Zod)    │           │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SERVICE LAYER                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Auth Service │  │ Calendar     │  │ Email        │  │ ICS Service  │   │
│  │              │  │ Service      │  │ Service      │  │              │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │ Notification │  │ Booking      │  │ Business     │                     │
│  │ Service      │  │ Service      │  │ Service      │                     │
│  └──────────────┘  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │         MongoDB                 │  │           Redis                  │  │
│  │  - Business data                │  │  - JWT blacklist (logout)       │  │
│  │  - Events/Bookings              │  │  - Rate limiting state          │  │
│  │  - Customers                    │  │  - WebSocket session mapping    │  │
│  │  - Employees, Services          │  │  - Cache (business configs)     │  │
│  │  - Locations                    │  │                                 │  │
│  └─────────────────────────────────┘  └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3. Core Architectural Principles

### 3.1 Multi-Tenancy Model

- **Single Database, Shared Schema**: All businesses share the same MongoDB database
- **Business Isolation**: Every document includes a `businessId` field for data isolation
- **Business Code Entry**: Mobile app users enter a unique code to "activate" a business context

### 3.2 Stateless API Design

- JWT tokens contain all necessary session information
- No server-side session storage (except Redis for blacklist/logout)
- Horizontal scaling ready

### 3.3 UTC-First Time Handling

- **Database**: All timestamps stored in UTC (ISO 8601)
- **API**: All datetime fields in request/response are UTC
- **Client**: Mobile app converts to user's local timezone for display
- **Business Timezone**: Stored per-business for working hours interpretation

### 3.4 .ics Compatibility

Events are stored in a format compatible with the iCalendar (RFC 5545) standard:
- `uid`: Unique identifier for the event
- `dtstart` / `dtend`: Start and end times in UTC
- `rrule`: Recurrence rule (RFC 5545 format)
- `sequence`: Modification counter
- `summary` / `description`: Event details

This enables future integrations with Google Calendar, Outlook, Apple Calendar, etc.

## 4. Authentication & Authorization

### 4.1 User Types

| User Type | Authentication | Access Level |
|-----------|----------------|--------------|
| Customer | None (anonymous) | Public endpoints only |
| Business Admin | Business Code + Password → JWT | All business management |
| Super Admin | API Key Header | Platform-wide management |

### 4.2 JWT Token Structure

```json
{
  "businessId": "ObjectId",
  "type": "business_admin",
  "iat": 1234567890,
  "exp": 1237246290
}
```

- **Expiration**: 30 days (monthly login requirement)
- **Refresh**: Sliding window - new token issued before expiration

### 4.3 Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Mobile  │     │   API    │     │  Auth    │     │ MongoDB  │
│   App    │     │  Server  │     │ Service  │     │          │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ POST /auth/business/login       │                │
     │ {code, password}                │                │
     │───────────────>│                │                │
     │                │ validateLogin()│                │
     │                │───────────────>│                │
     │                │                │ findByCode()   │
     │                │                │───────────────>│
     │                │                │<───────────────│
     │                │                │ verifyPassword │
     │                │                │ generateJWT()  │
     │                │<───────────────│                │
     │ {token, business, expiresAt}    │                │
     │<───────────────│                │                │
     │                │                │                │
     │ GET /business/events            │                │
     │ Authorization: Bearer <token>   │                │
     │───────────────>│                │                │
     │                │ verifyJWT()    │                │
     │                │───────────────>│                │
     │                │<───────────────│                │
     │                │ getEvents(businessId)           │
     │                │───────────────────────────────>│
     │                │<───────────────────────────────│
     │ {events: [...]}│                │                │
     │<───────────────│                │                │
```

## 5. Real-Time Updates (WebSocket)

### 5.1 Connection Flow

1. Client connects to WebSocket server with JWT token
2. Server validates token and extracts `businessId`
3. Client joins business-specific room: `business:{businessId}`
4. All events for that business are broadcast to room members

### 5.2 Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_business_room` | Client → Server | `{businessId}` |
| `leave_business_room` | Client → Server | `{businessId}` |
| `event_created` | Server → Client | `{event}` |
| `event_updated` | Server → Client | `{event}` |
| `event_deleted` | Server → Client | `{eventId}` |
| `booking_status_changed` | Server → Client | `{booking, status}` |

### 5.3 Scaling Considerations

- Redis adapter for Socket.io enables horizontal scaling
- Each API instance can handle WebSocket connections
- Events published to Redis are broadcast across all instances

## 6. Internationalization (i18n)

### 6.1 Supported Languages

- **Bulgarian (bg)**: Default language
- **English (en)**: Secondary language

### 6.2 Implementation

- `Accept-Language` header determines response language
- Fallback chain: Request Header → Business Default → Bulgarian
- All user-facing strings (errors, emails, notifications) are translatable

### 6.3 Currency

- **EUR**: Only supported currency for MVP
- Currency stored per-business for future expansion

## 7. Data Flow Examples

### 7.1 Customer Booking Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Customer │     │   API    │     │ Services │     │ Database │
│   App    │     │          │     │          │     │          │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ GET /businesses/lookup/SALON1   │                │
     │───────────────>│                │                │
     │ {business}     │                │                │
     │<───────────────│                │                │
     │                │                │                │
     │ GET /businesses/:id/availability│                │
     │ ?serviceId=x&employeeId=y       │                │
     │───────────────>│                │                │
     │                │ getAvailability│                │
     │                │───────────────>│                │
     │                │                │ query events   │
     │                │                │───────────────>│
     │                │                │<───────────────│
     │                │ {slots: [...]} │                │
     │<───────────────│                │                │
     │                │                │                │
     │ POST /bookings │                │                │
     │ {serviceId, employeeId, start}  │                │
     │───────────────>│                │                │
     │                │ createBooking()│                │
     │                │───────────────>│                │
     │                │                │ create event   │
     │                │                │───────────────>│
     │                │                │ create customer│
     │                │                │───────────────>│
     │                │                │ send email     │
     │                │                │───────────────>│
     │                │ broadcast WS   │                │
     │                │<───────────────│                │
     │ {booking}      │                │                │
     │<───────────────│                │                │
```

## 8. Error Handling

### 8.1 Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {"field": "email", "message": "Invalid email format"}
    ]
  }
}
```

### 8.2 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., time slot taken) |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

## 9. Security Considerations

### 9.1 Authentication Security

- Passwords hashed with bcrypt (cost factor 10+)
- JWT tokens with reasonable expiration (30 days)
- Redis-based token blacklist for logout

### 9.2 API Security

- Rate limiting per IP and per business
- CORS configured for mobile app origins
- Input validation on all endpoints (Zod)
- SQL/NoSQL injection prevention via Mongoose

### 9.3 Data Protection

- Sensitive fields encrypted at rest (passwords)
- HTTPS only in production
- No PII in logs

## 10. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │   CloudFront    │     │   Route 53      │                   │
│  │   (CDN)         │     │   (DNS)         │                   │
│  └────────┬────────┘     └────────┬────────┘                   │
│           │                       │                             │
│           ▼                       ▼                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Application Load Balancer                   │   │
│  └─────────────────────────┬───────────────────────────────┘   │
│                            │                                    │
│           ┌────────────────┼────────────────┐                  │
│           ▼                ▼                ▼                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ ECS/Fargate │  │ ECS/Fargate │  │ ECS/Fargate │            │
│  │ API + WS    │  │ API + WS    │  │ API + WS    │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                    │
│         └────────────────┼────────────────┘                    │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │  ┌─────────────────┐        ┌─────────────────┐         │  │
│  │  │   MongoDB       │        │   ElastiCache   │         │  │
│  │  │   Atlas         │        │   Redis         │         │  │
│  │  └─────────────────┘        └─────────────────┘         │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 11. Monitoring & Observability

- **Logging**: Winston with JSON format, shipped to CloudWatch
- **Metrics**: Custom metrics for booking rates, API latency
- **Alerts**: CloudWatch alarms for error rates, latency spikes
- **Tracing**: Request IDs propagated through all layers

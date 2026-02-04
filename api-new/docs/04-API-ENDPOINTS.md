# API Endpoints

Complete reference for all API endpoints, including request/response formats and examples.

## Base URL

```
Development: http://localhost:3001
Production:  https://your-api-domain.com
```

## Authentication

### Admin Endpoints

Protected endpoints require the `admin_password` header:

```http
POST /business
admin_password: your-admin-password
Content-Type: application/json
```

### Public Endpoints

Most GET endpoints and the event booking POST are public.

## Rate Limiting

All endpoints are rate-limited:
- **Limit:** 100 requests per 15 minutes per IP
- **Error Response:**
```json
{
    "message": "Too many requests, please try again later."
}
```

---

## Business Endpoints

### Get Business Information

Retrieve complete business information including services, locations, employees, and calendar.

```http
GET /business/:tld
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `tld` | string | The business website domain (partial match supported) |

**Example Request:**
```bash
curl http://localhost:3001/business/eleganthair.com
```

**Success Response (200):**
```json
{
    "business": {
        "name": "Elegant Hair Studio",
        "description": "Premium hair styling services",
        "logo": "https://example.com/logo.png",
        "website": "https://eleganthair.com",
        "phone": "+1234567890",
        "email": "contact@eleganthair.com",
        "socialMedia": {
            "facebook": "https://facebook.com/eleganthair",
            "instagram": "https://instagram.com/eleganthair"
        },
        "workingHours": null,
        "availableCalendar": true,
        "maximumDaysInFuture": 30,
        "status": "active",
        "privacyPolicyURL": null,
        "services": [
            {
                "_id": "507f1f77bcf86cd799439020",
                "name": "Haircut",
                "price": 25,
                "priceEur": "25.00",
                "currency": "EUR",
                "timeSlots": 2,
                "status": "active"
            }
        ],
        "locations": [
            {
                "_id": "507f1f77bcf86cd799439040",
                "name": "Downtown Branch",
                "addressName": "123 Main Street",
                "lat": 42.6977,
                "lon": 23.3219,
                "phone": "+1234567890",
                "employees": ["507f1f77bcf86cd799439013"],
                "workingHours": [
                    {"day": "monday", "open": "09:00", "close": "18:00"}
                ],
                "status": "active"
            }
        ],
        "employees": [
            {
                "_id": "507f1f77bcf86cd799439013",
                "name": "John Stylist",
                "services": ["507f1f77bcf86cd799439020"],
                "status": "active"
            }
        ],
        "calendar": {
            "_id": "507f1f77bcf86cd799439012",
            "timezone": "Europe/Sofia",
            "status": "active"
        }
    }
}
```

**Error Responses:**
| Status | Error | Description |
|--------|-------|-------------|
| 404 | `errors.not_found` | Business not found or deleted |
| 409 | `errors.inactive` | Business exists but is inactive |

---

### Create Business (Admin)

Create a new business entity.

```http
POST /business
```

**Headers:**
```
admin_password: your-admin-password
Content-Type: application/json
```

**Request Body:**
```json
{
    "name": "My Salon",
    "description": "A great place for haircuts",
    "logo": "https://example.com/logo.png",
    "phone": "+1234567890",
    "email": "contact@mysalon.com",
    "website": "https://mysalon.com",
    "socialMedia": {
        "facebook": "https://facebook.com/mysalon"
    },
    "URLpostfix": "my-salon",
    "slotTime": 15,
    "maximumDaysInFuture": 30,
    "minimumTimeSlotsInFuture": 4,
    "status": "active",
    "isEmailSender": true,
    "senderEmail": "noreply@mysalon.com",
    "senderPassword": "gmail-app-password"
}
```

**Field Validations:**
| Field | Rules |
|-------|-------|
| `name` | 3-100 characters, required |
| `description` | Max 500 characters |
| `phone` | International format: `^\+?[1-9]\d{1,14}$` |
| `email` | Valid email format |
| `website` | Valid URI |
| `URLpostfix` | Pattern: `^[a-zA-Z0-9-_]+$`, required |
| `slotTime` | 1-1440 (minutes), required |
| `maximumDaysInFuture` | 1-60, required |
| `minimumTimeSlotsInFuture` | 1-1440, required |
| `status` | One of: 'active', 'inactive', 'deleted' |
| `isEmailSender` | Boolean, required |
| `senderEmail` | Required if isEmailSender is true |
| `senderPassword` | Required if isEmailSender is true |

**Success Response (201):** Empty body with 201 status

**Error Responses:**
| Status | Error | Description |
|--------|-------|-------------|
| 400 | Validation error | Invalid request body |
| 401 | Unauthorized | Missing or invalid admin password |
| 409 | Business already exists | Duplicate website |

---

### Update Business (Admin)

Update an existing business.

```http
PUT /business/:id
```

**Headers:**
```
admin_password: your-admin-password
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
    "description": "Updated description",
    "phone": "+0987654321",
    "slotTime": 20,
    "status": "inactive"
}
```

**Success Response (200):** Empty body with 200 status

---

## Service Endpoints

### Get Service

```http
GET /service/:id
```

**Success Response (200):**
```json
{
    "_id": "507f1f77bcf86cd799439020",
    "name": "Haircut",
    "price": 25,
    "priceEur": "25.00",
    "currency": "EUR",
    "timeSlots": 2,
    "businessId": "507f1f77bcf86cd799439011",
    "status": "active"
}
```

---

### Create Service (Admin)

```http
POST /service
```

**Request Body:**
```json
{
    "name": "Haircut",
    "price": 25,
    "priceEur": "25.00",
    "currency": "EUR",
    "timeSlots": 2,
    "businessId": "507f1f77bcf86cd799439011",
    "status": "active"
}
```

**Field Validations:**
| Field | Rules |
|-------|-------|
| `name` | 3-100 characters, required |
| `price` | Minimum 0, required |
| `currency` | 3 characters, required |
| `timeSlots` | 1-24, required |
| `businessId` | Valid ObjectId, required |
| `status` | One of: 'active', 'inactive', 'deleted' |

---

### Update Service (Admin)

```http
PUT /service/:id
```

**Request Body:**
```json
{
    "price": 30,
    "timeSlots": 3,
    "status": "active"
}
```

---

## Employee Endpoints

### Get Employee

```http
GET /employee/:id
```

**Success Response (200):**
```json
{
    "_id": "507f1f77bcf86cd799439013",
    "name": "John Stylist",
    "teamupSubCalendarId": 12345,
    "businessId": "507f1f77bcf86cd799439011",
    "services": ["507f1f77bcf86cd799439020"],
    "status": "active"
}
```

---

### Create Employee (Admin)

```http
POST /employee
```

**Request Body:**
```json
{
    "name": "John Stylist",
    "teamupSubcalendarId": "12345",
    "businessId": "507f1f77bcf86cd799439011",
    "services": ["507f1f77bcf86cd799439020"],
    "status": "active"
}
```

**Validations:**
- Business must exist and be active
- All services must exist, be active, and belong to the same business

---

### Update Employee (Admin)

```http
PUT /employee/:id
```

**Request Body:**
```json
{
    "teamupSubcalendarId": "12346",
    "services": ["507f1f77bcf86cd799439020", "507f1f77bcf86cd799439021"],
    "status": "active"
}
```

---

## Location Endpoints

### Get Location

```http
GET /location/:id
```

**Success Response (200):**
```json
{
    "_id": "507f1f77bcf86cd799439040",
    "name": "Downtown Branch",
    "addressName": "123 Main Street",
    "lat": 42.6977,
    "lon": 23.3219,
    "phone": "+1234567890",
    "businessId": "507f1f77bcf86cd799439011",
    "employees": ["507f1f77bcf86cd799439013"],
    "workingHours": [
        {"day": "monday", "open": "09:00", "close": "18:00"}
    ],
    "status": "active"
}
```

---

### Create Location (Admin)

```http
POST /location
```

**Request Body:**
```json
{
    "name": "Downtown Branch",
    "addressName": "123 Main Street, City Center",
    "lat": 42.6977,
    "lon": 23.3219,
    "phone": "+1234567890",
    "businessId": "507f1f77bcf86cd799439011",
    "employees": ["507f1f77bcf86cd799439013"],
    "workingHours": [
        {"day": "monday", "open": "09:00", "close": "18:00"},
        {"day": "tuesday", "open": "09:00", "close": "18:00"}
    ],
    "status": "active"
}
```

**Field Validations:**
| Field | Rules |
|-------|-------|
| `name` | 3-100 characters, required |
| `addressName` | 3-100 characters, required |
| `lat` | -90 to 90, required |
| `lon` | -180 to 180, required |
| `phone` | String, required |
| `workingHours.day` | One of: monday-sunday |
| `workingHours.open/close` | Format: HH:mm (24-hour) |

---

### Update Location (Admin)

```http
PUT /location/:id
```

**Request Body:**
```json
{
    "name": "Updated Branch Name",
    "employees": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
    "status": "active"
}
```

---

## Calendar Endpoints

### Get Calendar

```http
GET /calendar/:id
```

**Success Response (200):**
```json
{
    "_id": "507f1f77bcf86cd799439012",
    "businessId": "507f1f77bcf86cd799439011",
    "integration": "TEAMUP",
    "teamupApiKey": "abc123xyz",
    "teamupSecretCalendarKey": "ks123abc",
    "timezone": "Europe/Sofia",
    "teamupSubCalendarIds": [
        {"id": 12345, "name": "John's Calendar"}
    ],
    "lastSynchronized": "2024-01-15T10:30:00.000Z",
    "status": "active"
}
```

---

### Create Calendar (Admin)

```http
POST /calendar
```

**Request Body:**
```json
{
    "businessId": "507f1f77bcf86cd799439011",
    "integration": "TEAMUP",
    "teamupApiKey": "your-teamup-api-key",
    "teamupSecretCalendarKey": "your-secret-calendar-key",
    "status": "active"
}
```

**Notes:**
- Upon creation, the API fetches configuration from Teamup (timezone, sub-calendars)
- Initial events are synced from Teamup

---

### Update Calendar (Admin)

```http
PUT /calendar/:id
```

**Request Body:**
```json
{
    "status": "inactive"
}
```

---

## Event Endpoints

### Get Available Time Slots

Get available booking slots for a specific employee and service.

```http
GET /event/available
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `calendarId` | string | Yes | Calendar ObjectId |
| `employeeId` | string | Yes | Employee ObjectId |
| `serviceId` | string | Yes | Service ObjectId |

**Example Request:**
```bash
curl "http://localhost:3001/event/available?calendarId=xxx&employeeId=yyy&serviceId=zzz"
```

**Success Response (200):**
```json
[
    {
        "start": "2024-01-15T09:00:00.000Z",
        "end": "2024-01-15T09:30:00.000Z"
    },
    {
        "start": "2024-01-15T09:30:00.000Z",
        "end": "2024-01-15T10:00:00.000Z"
    },
    {
        "start": "2024-01-15T10:00:00.000Z",
        "end": "2024-01-15T10:30:00.000Z"
    }
]
```

**How Slots Are Calculated:**
1. Gets location working hours for the employee
2. Applies minimum advance booking time
3. Checks against existing events in the calendar
4. Returns non-overlapping slots for the service duration

---

### Create Booking (Event)

Book an appointment.

```http
POST /event
```

**Request Body:**
```json
{
    "calendarId": "507f1f77bcf86cd799439012",
    "employeeId": "507f1f77bcf86cd799439013",
    "serviceId": "507f1f77bcf86cd799439020",
    "startDt": "2024-01-15T10:00:00.000Z",
    "endDt": "2024-01-15T10:30:00.000Z",
    "name": "John Customer",
    "email": "john@example.com",
    "phone": "+1234567890",
    "timezone": "Europe/Sofia"
}
```

**Field Validations:**
| Field | Rules |
|-------|-------|
| `calendarId` | Valid ObjectId, required |
| `employeeId` | Valid ObjectId, required |
| `serviceId` | Valid ObjectId, required |
| `startDt` | Valid ISO date, required |
| `endDt` | Valid ISO date, required |
| `name` | 3-100 characters, required |
| `email` | Valid email format, required |
| `phone` | String, required |
| `timezone` | Valid IANA timezone, required |

**Business Logic:**
1. Validates all referenced entities exist and are active
2. Verifies employee offers the requested service
3. Checks duration matches service definition
4. Validates time slot is available
5. Creates event in Teamup
6. Saves event to local database
7. Sends confirmation email to customer
8. Saves customer personal data

**Success Response (201):**
```json
{
    "calendarId": "507f1f77bcf86cd799439012",
    "teamupSubCalendarIds": [12345],
    "start": "2024-01-15T10:00:00+02:00",
    "end": "2024-01-15T10:30:00+02:00",
    "allDay": false,
    "teamupEventId": "evt_abc123"
}
```

**Error Responses:**
| Status | Error | Description |
|--------|-------|-------------|
| 400 | Validation error | Invalid request body |
| 404 | `errors.not_found` | Entity not found |
| 409 | `errors.inactive` | Entity is inactive |
| 409 | `errors.invalid_service` | Employee doesn't offer service |
| 409 | `errors.invalid_duration` | Duration doesn't match service |
| 409 | `errors.invalid_time_slot_or_unavailable` | Slot not available |
| 500 | `errors.teamup_event_creation_failed` | Teamup API error |

---

## Notice Endpoints

### Get Employee Notices

```http
GET /notice/:employeeId
```

**Success Response (200):**
```json
[
    {
        "_id": "507f1f77bcf86cd799439050",
        "employeeId": "507f1f77bcf86cd799439013",
        "message": "Remember the 3pm appointment"
    }
]
```

---

## Webhook Endpoints

### Teamup Event Webhook

Receives event updates from Teamup calendar.

```http
POST /webhook/event
```

**Headers:**
```
teamup-signature: HMAC-SHA256 signature
Content-Type: application/json
```

**Request Body (from Teamup):**
```json
{
    "dispatch": [
        {
            "trigger": "event.created",
            "event": {
                "id": "evt_abc123",
                "subcalendar_ids": [12345],
                "all_day": false,
                "rrule": null,
                "start_dt": "2024-01-15T10:00:00Z",
                "end_dt": "2024-01-15T10:30:00Z"
            }
        }
    ]
}
```

**Supported Triggers:**
| Trigger | Action |
|---------|--------|
| `event.created` | Create event in local database |
| `event.modified` | Update event in local database |
| `event.removed` | Delete event from local database |

**Note:** Recurring events trigger a full calendar sync.

---

## Common Error Responses

### Validation Error (400)

```json
{
    "status": 400,
    "error": "\"name\" length must be at least 3 characters long",
    "dt": 1705312345678
}
```

### Not Found (404)

```json
{
    "status": 404,
    "error": "errors.not_found",
    "dt": 1705312345678
}
```

### Conflict (409)

```json
{
    "status": 409,
    "error": "errors.inactive",
    "dt": 1705312345678
}
```

### Internal Server Error (500)

```json
{
    "status": 500,
    "error": "errors.internal_server_error",
    "dt": 1705312345678
}
```

---

## Error Codes Reference

| Error Code | Meaning |
|------------|---------|
| `errors.not_found` | Resource doesn't exist or is deleted |
| `errors.inactive` | Resource exists but is not active |
| `errors.invalid_id` | Invalid MongoDB ObjectId format |
| `errors.invalid_business` | Resource doesn't belong to the business |
| `errors.invalid_service` | Employee doesn't offer the service |
| `errors.invalid_duration` | Time slot duration doesn't match service |
| `errors.invalid_time_slot_or_unavailable` | Time slot is not valid or already booked |
| `errors.teamup_event_creation_failed` | Failed to create event in Teamup |
| `errors.internal_server_error` | Unexpected server error |

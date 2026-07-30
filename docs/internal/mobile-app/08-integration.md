# AppointX Mobile App — API Integration

**Document type:** Technical Specification  
**Status:** Draft  
**Date:** 2026-02-24  
**Source:** `docs/internal/appointx-hosting.md` Section 17

---

## 1. Base URL & Headers

| Item | Value |
|------|-------|
| Base URL | `{EXPO_PUBLIC_API_URL}/api` (e.g. `https://api.appointx.bg/api` or CloudFront origin) |
| Content-Type | `application/json` |
| Client Mode | No auth headers |
| Business Mode | `X-Business-Password: {password}` |

---

## 2. Public Routes (No Auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/public/health` | Health check |
| GET | `/public/business/code/{code}` | Resolve business by code (mobile entry) |
| GET | `/public/business/slug/{slug}` | Resolve business by slug (web; mobile may not use) |
| GET | `/public/business/{bizId}/config` | Full business public config |
| GET | `/public/business/{bizId}/availability` | Available slots (query: date, serviceId, locationId) |
| POST | `/public/business/{bizId}/appointments` | Create appointment |
| GET | `/public/business/{bizId}/appointments/{aptId}` | Get appointment status |
| POST | `/public/business/{bizId}/appointments/{aptId}/cancel` | Client cancel |
| POST | `/public/registrations` | Submit registration (marketing; mobile may not use) |
| POST | `/public/push-token` | Register push token |

---

## 3. Staff Routes (X-Business-Password)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/staff/{bizId}/appointments` | List appointments |
| GET | `/staff/{bizId}/appointments/{aptId}` | Appointment detail |
| POST | `/staff/{bizId}/appointments` | Create (manual) |
| PUT | `/staff/{bizId}/appointments/{aptId}` | Reschedule |
| POST | `/staff/{bizId}/appointments/{aptId}/cancel` | Cancel |
| POST | `/staff/{bizId}/appointments/{aptId}/complete` | Complete |
| POST | `/staff/{bizId}/appointments/{aptId}/noshow` | No-show |
| GET | `/staff/{bizId}/calendar` | Calendar data |
| POST | `/staff/{bizId}/blocked-time` | Create blocked time |
| PUT | `/staff/{bizId}/blocked-time/{blkId}` | Edit blocked time |
| DELETE | `/staff/{bizId}/blocked-time/{blkId}` | Delete blocked time |

---

## 4. Request / Response Conventions

| Convention | Notes |
|------------|-------|
| Request body | JSON for POST/PUT |
| Response | JSON. Success: 2xx. Client error: 4xx. Server error: 5xx. |
| Error body | `{ message?: string, code?: string, ... }` — exact schema TBD by API implementation |
| CORS | Handled by backend (Hono). Mobile app same-origin to API base URL. |

---

## 5. Push Token Registration

**Request:** `POST /api/public/push-token`

```json
{
  "deviceToken": "string",
  "platform": "android" | "ios",
  "bizId": "string",
  "clientPhone": "string"
}
```

**Response:** 2xx on success. Backend creates SNS endpoint and stores mapping.

---

## 6. Create Appointment (Client)

**Request:** `POST /api/public/business/{bizId}/appointments`

```json
{
  "locationId": "string",
  "serviceId": "string",
  "employeeId": "string",
  "date": "YYYY-MM-DD",
  "timeSlot": "HH:mm",
  "clientName": "string",
  "clientPhone": "string",
  "clientEmail": "string"
}
```

**Response:** 201 with appointment object (id, referenceCode, status, etc.). Exact schema TBD by API.

---

## 7. Error Handling

| Status | Mobile behavior |
|--------|-----------------|
| 400 | Show validation message from body |
| 401 | (Business Mode) Clear password, return to password entry |
| 403 | Show "Access denied" or "Business unavailable" |
| 404 | Show "Not found" or "Invalid code" |
| 5xx | Show "Something went wrong", offer retry |

---

## 8. Media URLs

Logos and avatars from config are served via CloudFront at `/assets/*`. Use full URL from API response (e.g. `https://{domain}/assets/{path}`).

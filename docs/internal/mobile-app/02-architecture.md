# AppointX Mobile App — Architecture

**Document type:** Technical Specification  
**Status:** Draft  
**Date:** 2026-02-24

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     AppointX Mobile App                        │
├─────────────────────────────────────────────────────────────────┤
│  Client Mode                    │  Business Mode                 │
│  (anonymous)                    │  (X-Business-Password)        │
├─────────────────────────────────┼───────────────────────────────┤
│  • Code entry / deep link        │  • Code + password entry       │
│  • Booking wizard (6 steps)      │  • Calendar, appointments      │
│  • My appointments               │  • Blocked time                 │
│  • Settings, multi-business      │  • Settings                    │
├─────────────────────────────────┴───────────────────────────────┤
│  Shared: Theme (white-label), i18n, API client, local storage    │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  API (CloudFront → API GW)     │
                    │  /api/public/*  (no auth)      │
                    │  /api/staff/*   (password)    │
                    └───────────────────────────────┘
```

---

## 2. Module Structure

| Module | Responsibility |
|--------|-----------------|
| **Entry / routing** | Code entry screen, deep link handling, mode selection (Client vs Business) |
| **Client Mode** | Booking wizard, My appointments, Info, Settings |
| **Business Mode** | Calendar, appointment list, appointment detail, blocked time, manual booking |
| **API layer** | HTTP client, base URL, auth header injection, error handling |
| **Offline / cache** | Cache business config, appointments, calendar data. Sync when online. Disable mutations when offline (no queue). |
| **Connectivity** | Network state detection. Drives offline banner and feature availability. |
| **State** | Selected business, booking wizard state, cached appointments, online/offline |
| **Persistence** | Client info, business codes, appointments, business config cache, calendar cache, business password (Business Mode) |
| **Theme** | White-label colors, typography from `GET /api/public/business/{bizId}/config` |

---

## 3. Data Flow

### 3.1 Client Mode — Booking

1. User enters business code → `GET /api/public/business/code/{code}` → resolve `bizId`
2. Load config → `GET /api/public/business/{bizId}/config` → branding, locations, services, employees
3. Wizard steps: location, service, date/time, employee, personal info (from local storage), confirmation
4. Availability → `GET /api/public/business/{bizId}/availability?date=&serviceId=&locationId=`
5. Submit → `POST /api/public/business/{bizId}/appointments` with client info from local storage
6. Store appointment locally for "My appointments" tab

### 3.2 Client Mode — My Appointments

- **Source:** Local storage (appointments stored after booking). When online: optional `GET /api/public/business/{bizId}/appointments/{aptId}` for status refresh.
- **Offline:** Show cached appointments. Persistent offline banner when viewing cached data.
- **Cancel:** `POST /api/public/business/{bizId}/appointments/{aptId}/cancel` (requires online; if offline, disable with "Connect to cancel").

### 3.3 Business Mode — Calendar & Appointments

1. User enters code + password → validate via any staff route (requires online)
2. Store password in SecureStore for session
3. Calendar → `GET /api/staff/{bizId}/calendar` — cache response. When offline, show cached calendar.
4. Appointments list → `GET /api/staff/{bizId}/appointments` — cache. When offline, show cached list.
5. Actions: create, reschedule, cancel, complete, no-show — require online. When offline, show persistent banner; disable actions.

---

## 4. Auth Header Injection

| Mode | Header |
|------|--------|
| Client Mode | None |
| Business Mode | `X-Business-Password: {password}` on all `/api/staff/*` requests |

---

## 5. Error Handling

| Scenario | Behavior |
|----------|----------|
| Network error | Show retry option, preserve form state |
| 401 (Business Mode) | Clear stored password, return to password entry |
| 404 (business not found) | Show "Invalid code" message |
| 4xx/5xx from API | Show user-friendly message, log for debugging |
| Validation error | Inline form validation, prevent submit |

---

## 6. Offline-First Strategy

| Data | Cache when | Use when offline |
|------|------------|------------------|
| Business config | After successful fetch | Show cached config for wizard, Info, Settings |
| Business code → bizId | After resolve | Skip API for returning users with saved business |
| Client appointments | After booking, after refresh | My appointments tab |
| Business Mode calendar | After fetch | Calendar view |
| Business Mode appointments | After fetch | Appointments list, detail |
| Client info | User input | Always (local storage) |

**When offline and showing cached data:** A persistent UI element (offline banner) must be visible so the user always knows they are viewing cached/limited data. See Design System Section 8.

### 6.1 Offline Mutation Strategy

For actions that require online (cancel, reschedule, create, etc.): **disable** when offline and show a clear message (e.g. "Connect to cancel"). Do not queue mutations for later sync — this avoids conflict resolution, stale data, and UX ambiguity. Optional: a future enhancement could add an offline queue with retry and conflict handling.

---

## 7. Environment Configuration

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_API_URL` | Base URL for API (CloudFront or API Gateway). Dev vs prod. |

---

## 8. Cache & Storage Keys

Suggested storage keys for AsyncStorage (or equivalent). Structure is implementation-specific; this is a reference.

| Key | Content | Invalidate |
|-----|---------|------------|
| `client_info` | `{ name, phone, email }` | User edits |
| `businesses` | `[{ code, bizId, name?, ... }]` | User add/remove |
| `config_{bizId}` | Full business config | On fetch |
| `appointments_{bizId}` | Client appointments (Client Mode) | On booking, refresh |
| `calendar_{bizId}_{startDate}_{endDate}` | Calendar data | On fetch |
| `appointments_staff_{bizId}_{date}` | Staff appointments list | On fetch |
| `appointment_{aptId}` | Single appointment detail | On fetch |

**Business Mode password:** Store in SecureStore, not AsyncStorage. Key: `business_password_{bizId}` or similar.

---

## 9. References

- API routes: Hosting spec Section 17
- Auth: Hosting spec Section 8
- Push: Hosting spec Section 10.2

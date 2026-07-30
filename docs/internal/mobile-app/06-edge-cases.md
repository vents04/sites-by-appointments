# AppointX Mobile App — Edge Cases & Offline Behavior

**Document type:** Technical Specification  
**Status:** Draft  
**Date:** 2026-02-24  
**PRD reference:** `docs/client/appointx-mobile.md` Sections 7–8

---

## 1. Offline Behavior (PRD 8)

**Principle:** The app should work offline as much as possible. Maximize offline-capable features. For any screen that shows cached or local data while the user is offline, display a **persistent offline banner** (see Design System Section 8) so the user always knows they are in a limited/cached state.

### 1.1 Offline-Capable Features

| Feature | Offline behavior |
|---------|------------------|
| **Code entry** | Works if business was previously resolved (bizId cached). New code requires online. |
| **Client Mode — Book tab** | Browse cached config (locations, services, employees). Availability and submit require online. Show offline banner when config is cached. |
| **Client Mode — My appointments** | Show cached appointments. Cancel requires online (disable or queue). **Persistent offline banner when viewing cached list.** |
| **Client Mode — Info tab** | Show cached business config. **Offline banner if cached.** |
| **Client Mode — Settings** | Show cached businesses, personal info (local). Add business requires online. **Offline banner when any data is cached.** |
| **Business Mode — Calendar** | Show cached calendar data when offline. Create/edit/delete require online. **Persistent offline banner.** |
| **Business Mode — Appointments list** | Show cached list. All actions require online. **Persistent offline banner.** |
| **Business Mode — Appointment detail** | Show cached detail. Actions require online. **Persistent offline banner.** |

### 1.2 Online-Required Features

| Feature | When offline |
|---------|--------------|
| Resolve new business code | Show "No connection" message, retry option |
| Fetch availability | Disable date/time selection or show "Connect to see availability" |
| Submit booking | Disable submit, show offline banner |
| Cancel appointment | Disable Cancel, show "Connect to cancel" (do not queue) |
| Business Mode — password validation | Block entry until online |
| Business Mode — create, reschedule, cancel, complete, no-show | Disable, show offline banner |
| Business Mode — blocked time | Disable create/edit/delete |
| Push token registration | Defer until online |

### 1.3 Other Scenarios

| Scenario | Behavior |
|----------|----------|
| **Network lost after submit, before response** | Treat as unknown. Show "Checking..." or retry. Do not assume success. |
| **Coming back online** | Refresh cached data in background. Dismiss offline banner when sync completes. |
| **Offline mutations** | Do not queue. Disable actions, show "Connect to …" message. Keeps UX simple and avoids sync conflicts. |

---

## 2. Deep Links (PRD 7)

| Scenario | Behavior |
|----------|----------|
| **Link format** | `appointx://business/{code}` or `https://appointx.bg/b/{code}` (universal link) |
| **App not installed** | Fallback to web or store |
| **App installed, cold start** | Open app, resolve code, navigate to business context (Client Mode) |
| **Multi-business** | Add business from deep link to list if new; switch to it if existing |
| **Business not found** | Show "Invalid code" |

---

## 3. Multi-Business (PRD 3.3, 4.6)

| Scenario | Behavior |
|----------|----------|
| **Add second business** | Settings → My businesses → Add code. Validate via API. Store. |
| **Switch business** | Select from list. Reload config, appointments for new business. |
| **Remove business** | Remove from list. Clear local appointments for that business. |
| **Same code, different device** | Each device has independent local storage. No sync. |

---

## 4. Cancellation Policy (PRD 4.4)

| Scenario | Behavior |
|----------|----------|
| **Client cancellations allowed** | Show Cancel button in My appointments |
| **Client cancellations disabled** | Hide Cancel, show policy message |
| **Deadline passed** | Disable Cancel, show "Cancellation deadline passed" |
| **API rejects cancel** | Show error (e.g. "Too late to cancel") |

---

## 5. Push Token Registration

| Scenario | Behavior |
|----------|----------|
| **User enables notifications** | Request permission, get device token, call `POST /api/public/push-token` with bizId, clientPhone |
| **User has multiple businesses** | Register token per business (bizId + clientPhone) |
| **Token refresh** | Re-register on app foreground if token changed |
| **Permission denied** | Do not call API. Store preference "disabled". |

---

## 6. Business Mode — Password

| Scenario | Behavior |
|----------|----------|
| **Wrong password** | 401 from API. Show "Invalid password". Do not store. |
| **Password changed by manager** | Next API call returns 401. Clear stored password, return to password entry. |
| **Session** | Store password in SecureStore. Clear on logout. |

---

## 7. Invalid / Deactivated Business

| Scenario | Behavior |
|----------|----------|
| **Business not found (404)** | "Invalid code" at code entry |
| **Business suspended/deactivated** | API may return 403 or 404. Show "Business unavailable". |
| **Deep link to invalid code** | Same as above |

---

## 8. Form Validation

| Field | Rules |
|-------|-------|
| Business code | Non-empty, format per API (e.g. alphanumeric) |
| Client name | Required, min length |
| Client phone | Required, valid format |
| Client email | Required, valid email format |
| Password | Non-empty |

Show inline errors. Prevent submit until valid.

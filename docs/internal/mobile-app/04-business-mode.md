# AppointX Mobile App — Business Mode

**Document type:** Technical Specification  
**Status:** Draft  
**Date:** 2026-02-24  
**PRD reference:** `docs/client/appointx-mobile.md` Section 5

---

## 1. Entry

| Step | PRD | API | Notes |
|------|-----|-----|-------|
| 1. Code entry | 5.1 | `GET /api/public/business/code/{code}` | Same as Client Mode |
| 2. Password entry | 5.1 | Validate via any staff route | e.g. `GET /api/staff/{bizId}/appointments?date=today` |
| Header | — | `X-Business-Password: {password}` | Required for all staff routes |

Password stored in SecureStore after successful validation. Cleared on 401.

---

## 2. Tab Navigation (PRD 5.2)

| Tab | Purpose |
|-----|---------|
| Calendar | Day/week views, appointments |
| Appointments list | Filterable list |
| Settings | Logout (clear password), app info |

---

## 3. Calendar Tab (PRD 5.3)

### Views (PRD 5.3)

| View | API | UI |
|------|-----|-----|
| Day | `GET /api/staff/{bizId}/calendar?startDate=&endDate=&locationId=` | Single-day grid. Cache for offline. |
| Week | Same | Week grid. Cache for offline. |

**Offline:** Show cached calendar. **Persistent offline banner.** Create appointment, blocked time require online.

### Navigation (PRD 5.3)

| Action | Behavior |
|--------|----------|
| Prev/next | Change date range, refetch |
| Today | Jump to current date |

### Interactions (PRD 5.3)

| Action | Behavior |
|--------|----------|
| Tap slot | Create appointment (manual booking) |
| Tap appointment | Open detail |
| Location filter | If multi-location business, filter by `locationId` |

---

## 4. Appointments List Tab (PRD 5.4)

| Item | Source |
|------|--------|
| Data | `GET /api/staff/{bizId}/appointments?date=&employeeId=&status=&search=`. Cache for offline. |
| UI | List with filters. **Persistent offline banner when showing cached list.** |
| Actions | Tap → detail. All mutations require online. |

---

## 5. Appointment Detail (PRD 5.5)

| Item | Source |
|------|--------|
| Data | `GET /api/staff/{bizId}/appointments/{aptId}`. Cache for offline. |
| UI | Full appointment info. **Offline banner when showing cached detail.** |
| Actions | Reschedule, Cancel, Complete, No-show — all require online. Disable when offline. |

| Action | API |
|--------|-----|
| Reschedule | `PUT /api/staff/{bizId}/appointments/{aptId}` |
| Cancel | `POST /api/staff/{bizId}/appointments/{aptId}/cancel` |
| Complete | `POST /api/staff/{bizId}/appointments/{aptId}/complete` |
| No-show | `POST /api/staff/{bizId}/appointments/{aptId}/noshow` |

---

## 6. Manual Booking (PRD 5.6)

| Step | API / Data |
|------|------------|
| Select location | From config or calendar context |
| Select service | Config → services for location |
| Select date/time | `GET /api/staff/{bizId}/calendar` or availability |
| Select employee | Config → employees for service |
| Enter client info | Form (name, phone, email) |
| Submit | `POST /api/staff/{bizId}/appointments` |

---

## 7. Blocked Time (PRD 5.7)

| Action | API |
|--------|-----|
| Create | `POST /api/staff/{bizId}/blocked-time` |
| Edit | `PUT /api/staff/{bizId}/blocked-time/{blkId}` |
| Delete | `DELETE /api/staff/{bizId}/blocked-time/{blkId}` |

| Item | Notes |
|------|-------|
| Data | Blocked time included in calendar response or separate fetch |
| UI | Create/edit form: employee (or all), location, start/end, reason, recurrence |

---

## 8. Settings Tab (PRD 5.8)

| Item | Purpose |
|------|---------|
| Logout | Clear stored password, return to code entry |
| About | App version |

---

## 9. API Summary — Business Mode

| Method | Path | Used in |
|--------|------|---------|
| GET | `/api/staff/{bizId}/appointments` | Calendar, list, password validation |
| GET | `/api/staff/{bizId}/appointments/{aptId}` | Detail |
| POST | `/api/staff/{bizId}/appointments` | Manual booking |
| PUT | `/api/staff/{bizId}/appointments/{aptId}` | Reschedule |
| POST | `/api/staff/{bizId}/appointments/{aptId}/cancel` | Cancel |
| POST | `/api/staff/{bizId}/appointments/{aptId}/complete` | Complete |
| POST | `/api/staff/{bizId}/appointments/{aptId}/noshow` | No-show |
| GET | `/api/staff/{bizId}/calendar` | Calendar view |
| POST | `/api/staff/{bizId}/blocked-time` | Create blocked time |
| PUT | `/api/staff/{bizId}/blocked-time/{blkId}` | Edit blocked time |
| DELETE | `/api/staff/{bizId}/blocked-time/{blkId}` | Delete blocked time |

All requests require `X-Business-Password` header.

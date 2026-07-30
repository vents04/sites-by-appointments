# AppointX Mobile App — Client Mode

**Document type:** Technical Specification  
**Status:** Draft  
**Date:** 2026-02-24  
**PRD reference:** `docs/client/appointx-mobile.md` Sections 3–4

---

## 1. Entry Points

| Entry | PRD | API | Notes |
|------|-----|-----|-------|
| Code entry | 3.1 | `GET /api/public/business/code/{code}` | Resolve business by code, get `bizId` |
| Deep link | 3.2 | Same | `appointx://business/{code}` or similar |
| Returning user (single business) | 3.4 | — | Skip code entry if one business saved |
| Multi-business | 3.3 | — | Switch business from Settings → My businesses |

---

## 2. Tab Navigation (PRD 4.1)

| Tab | Purpose |
|-----|---------|
| Book | Booking wizard |
| My appointments | Upcoming + past |
| Info | Business info, contact |
| Settings | My businesses, personal info, notifications, About |

---

## 3. Booking Wizard (PRD 4.2)

### Step 1: Location

| Item | Source |
|------|--------|
| Data | `GET /api/public/business/{bizId}/config` → `locations[]`. Cache config for offline. |
| UI | List/cards of locations (name, address). If offline and cached, show offline banner. |
| Selection | Store `locationId` for next step |

### Step 2: Service

| Item | Source |
|------|--------|
| Data | Config → `services[]` filtered by selected location |
| UI | List with name, duration, price |
| Selection | Store `serviceId` |

### Step 3: Date & Time

| Item | Source |
|------|--------|
| Data | `GET /api/public/business/{bizId}/availability?date=&serviceId=&locationId=` |
| UI | Date picker + time slot grid |
| Selection | Store `date`, `timeSlot` |

### Step 4: Employee

| Item | Source |
|------|--------|
| Data | Config → `employees[]` assigned to service |
| UI | List with name, avatar |
| Selection | Store `employeeId` |

### Step 5: Personal Info (PRD 4.2)

| Item | Source |
|------|--------|
| Data | Local storage (name, phone, email) — pre-fill if exists |
| UI | Form fields |
| Storage | Save to local storage for future bookings |

### Step 6: Confirmation (PRD 4.2)

| Item | Source |
|------|--------|
| Data | Summary of all selections |
| API | `POST /api/public/business/{bizId}/appointments` |
| Body | `{ locationId, serviceId, employeeId, date, timeSlot, clientName, clientPhone, clientEmail }` |
| Storage | Save returned appointment to local storage |

---

## 4. Success Screen (PRD 4.3)

| Item | Source |
|------|--------|
| Data | Appointment from API response (id, reference code, details) |
| UI | Success message, confirmation details, CTA to "My appointments" |

---

## 5. My Appointments Tab (PRD 4.4)

### Upcoming (PRD 4.4)

| Item | Source |
|------|--------|
| Data | Local storage (appointments with status Confirmed). Cache when online. |
| UI | List/cards with service, date, time, employee, location. **Persistent offline banner when showing cached data.** |
| Actions | Cancel (if policy allows) → requires online. If offline, disable with "Connect to cancel". |
| Optional | `GET /api/public/business/{bizId}/appointments/{aptId}` for status refresh when online |

### Past (PRD 4.4)

| Item | Source |
|------|--------|
| Data | Local storage (Completed, Cancelled, NoShow). Fully offline. |
| UI | List, read-only. Offline banner if any cached data on screen. |

---

## 6. Info Tab (PRD 4.5)

| Item | Source |
|------|--------|
| Data | Config → business name, description, locations. Cache for offline. |
| UI | Business info, contact details, map link if available. **Offline banner when showing cached config.** |

---

## 7. Settings Tab (PRD 4.6)

### My Businesses (PRD 4.6)

| Item | Source |
|------|--------|
| Data | Local storage (list of business codes + resolved bizIds) |
| UI | List, add new code, switch active business, remove |
| API | `GET /api/public/business/code/{code}` when adding |

### Personal Info (PRD 4.6)

| Item | Source |
|------|--------|
| Data | Local storage |
| UI | Edit name, phone, email |

### Notification Preferences (PRD 4.6)

| Item | Source |
|------|--------|
| Data | Local storage (push enabled/disabled) |
| API | `POST /api/public/push-token` when enabling (deviceToken, platform, bizId, clientPhone) |
| UI | Toggle for push notifications |

### About (PRD 4.6)

| Item | Source |
|------|--------|
| UI | App version, platform info, links |

---

## 8. API Summary — Client Mode

| Method | Path | Used in |
|--------|------|---------|
| GET | `/api/public/business/code/{code}` | Code entry, add business |
| GET | `/api/public/business/{bizId}/config` | Wizard steps 1–2–4, Info tab |
| GET | `/api/public/business/{bizId}/availability` | Wizard step 3 |
| POST | `/api/public/business/{bizId}/appointments` | Wizard step 6 |
| GET | `/api/public/business/{bizId}/appointments/{aptId}` | Status check (optional) |
| POST | `/api/public/business/{bizId}/appointments/{aptId}/cancel` | Cancel from My appointments |
| POST | `/api/public/push-token` | Settings → notifications |

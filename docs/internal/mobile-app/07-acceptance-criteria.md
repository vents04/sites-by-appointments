# AppointX Mobile App — Acceptance Criteria

**Document type:** Technical Specification  
**Status:** Draft  
**Date:** 2026-02-24  
**PRD reference:** `docs/client/appointx-mobile.md` Section 9 (User flows)

---

## 1. Client Mode Flows

### Flow 1: First-time client (manual code entry)

| Step | Acceptance |
|------|------------|
| 1 | User opens app, sees code entry screen |
| 2 | User enters valid code, taps Continue |
| 3 | App resolves business, loads config, shows Client Mode (Book tab) |
| 4 | User completes booking wizard (location → service → date/time → employee → info → confirm) |
| 5 | Appointment created, success screen shown |
| 6 | Appointment appears in My appointments |
| 7 | Client info saved locally for future bookings |

### Flow 2: First-time client (deep link from web)

| Step | Acceptance |
|------|------------|
| 1 | User taps deep link (e.g. from web booking page) |
| 2 | App opens, resolves code from link, loads business |
| 3 | User lands in Client Mode, can book immediately |
| 4 | If new business, added to My businesses |

### Flow 3: Returning client (single business)

| Step | Acceptance |
|------|------------|
| 1 | User has one saved business |
| 2 | App opens directly to Client Mode for that business (skip code entry) |
| 3 | User can book or view My appointments |

### Flow 4: Client with multiple businesses

| Step | Acceptance |
|------|------------|
| 1 | User has multiple businesses in Settings |
| 2 | User can switch active business from Settings → My businesses |
| 3 | App shows data for selected business |
| 4 | User can add new business via code |

### Flow 7: Client cancels appointment

| Step | Acceptance |
|------|------------|
| 1 | User has upcoming appointment in My appointments |
| 2 | If policy allows, Cancel button visible |
| 3 | User taps Cancel, confirms |
| 4 | API called, appointment cancelled |
| 5 | Appointment removed or marked cancelled in list |

### Flow 8: Client adds second business

| Step | Acceptance |
|------|------------|
| 1 | User in Settings → My businesses |
| 2 | User taps Add, enters new code |
| 3 | App validates, adds business to list |
| 4 | User can switch to new business |

---

## 2. Business Mode Flows

### Flow 5: Staff manages appointments

| Step | Acceptance |
|------|------------|
| 1 | User enters code + password |
| 2 | App validates, enters Business Mode |
| 3 | User sees calendar with appointments |
| 4 | User can view list, open detail, reschedule, cancel, complete, no-show |
| 5 | User can create manual booking |
| 6 | User can add/edit/delete blocked time |

### Flow 6: Staff searches appointment

| Step | Acceptance |
|------|------------|
| 1 | User in Appointments list tab |
| 2 | User applies filters (date, employee, status) or search |
| 3 | List updates per API response |
| 4 | User taps appointment → detail |

---

## 3. Cross-Cutting

| Criterion | Acceptance |
|-----------|------------|
| White-label | Business logo and primary color applied throughout |
| i18n | Bulgarian and English supported |
| Push | User can enable/disable; registration sent to API when enabled |
| **Offline** | App works offline as much as possible. Cached config, appointments, calendar shown when offline. |
| **Offline banner** | When offline and viewing cached/local data, a persistent UI element (banner) is always visible identifying the offline/cached state. User is never unsure whether data is live or cached. |
| Deep link | Opens app and resolves business from link |

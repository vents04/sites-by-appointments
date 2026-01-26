# Data Flows

This document explains how data moves through the system for key operations. Understanding these flows helps with debugging, optimization, and extending the system.

## Overview of Key Flows

| Flow | Trigger | Main Components |
|------|---------|-----------------|
| Booking an Appointment | Customer submits form | Event Route → Calendar Service → Teamup → Email |
| Getting Available Slots | Customer selects service | Event Route → Calendar Service → DB |
| Calendar Sync | Server startup / Webhook | Calendar Service → Teamup Service → DB |
| Business Page Load | Customer visits site | Business Route → DB |

---

## Flow 1: Booking an Appointment

This is the most complex flow, involving multiple validations and external services.

### Sequence Diagram

```
Customer          API              Validation       Database         Teamup          Email
   │               │                   │               │               │               │
   │ POST /event   │                   │               │               │               │
   │──────────────▶│                   │               │               │               │
   │               │                   │               │               │               │
   │               │ Validate body     │               │               │               │
   │               │──────────────────▶│               │               │               │
   │               │    Valid/Invalid  │               │               │               │
   │               │◀──────────────────│               │               │               │
   │               │                   │               │               │               │
   │               │ Get calendar      │               │               │               │
   │               │──────────────────────────────────▶│               │               │
   │               │                   │               │               │               │
   │               │ Get business      │               │               │               │
   │               │──────────────────────────────────▶│               │               │
   │               │                   │               │               │               │
   │               │ Get service       │               │               │               │
   │               │──────────────────────────────────▶│               │               │
   │               │                   │               │               │               │
   │               │ Get employee      │               │               │               │
   │               │──────────────────────────────────▶│               │               │
   │               │                   │               │               │               │
   │               │ Check time slot availability      │               │               │
   │               │──────────────────────────────────▶│               │               │
   │               │                   │               │               │               │
   │               │ Create event in Teamup            │               │               │
   │               │──────────────────────────────────────────────────▶│               │
   │               │                   │    Event ID   │               │               │
   │               │◀──────────────────────────────────────────────────│               │
   │               │                   │               │               │               │
   │               │ Save event to DB  │               │               │               │
   │               │──────────────────────────────────▶│               │               │
   │               │                   │               │               │               │
   │  Response 201 │                   │               │               │               │
   │◀──────────────│                   │               │               │               │
   │               │                   │               │               │               │
   │               │ Send email (async)│               │               │               │
   │               │────────────────────────────────────────────────────────────────────▶
   │               │                   │               │               │               │
   │               │ Save personal data│               │               │               │
   │               │──────────────────────────────────▶│               │               │
   │               │                   │               │               │               │
```

### Step-by-Step Breakdown

#### Step 1: Request Validation

```javascript
// Input
{
    "calendarId": "...",
    "employeeId": "...",
    "serviceId": "...",
    "startDt": "2024-01-15T10:00:00Z",
    "endDt": "2024-01-15T10:30:00Z",
    "name": "John Customer",
    "email": "john@example.com",
    "phone": "+1234567890",
    "timezone": "Europe/Sofia"
}

// Validation checks:
// - All IDs are valid MongoDB ObjectIds
// - Dates are valid ISO strings
// - Email matches email pattern
// - Timezone is in IANA timezone list
```

#### Step 2: Entity Validation

```javascript
// Check calendar exists and is active
const calendar = await DbService.getOne(CALENDARS, { _id: calendarId });
if (!calendar || calendar.status !== 'active') → Error

// Check business exists and is active  
const business = await DbService.getById(BUSINESSES, calendar.businessId);
if (!business || business.status !== 'active') → Error

// Check service exists, is active, and belongs to business
const service = await DbService.getById(SERVICES, serviceId);
if (service.businessId !== calendar.businessId) → Error

// Check employee exists, is active, and belongs to business
const employee = await DbService.getById(EMPLOYEES, employeeId);
if (employee.businessId !== calendar.businessId) → Error

// Check employee offers this service
if (!employee.services.includes(service._id)) → Error
```

#### Step 3: Duration Validation

```javascript
// Service duration must match requested time slot
const serviceDuration = service.timeSlots * business.slotTime;  // e.g., 2 * 15 = 30 min
const requestedDuration = (endDt - startDt) / 60000;  // in minutes

if (requestedDuration !== serviceDuration) → Error
```

#### Step 4: Availability Check

```javascript
// Uses CalendarService.checkTimeSlotValidityAndAvailability()
// 1. Gets all available slots for the employee/service
// 2. Checks if requested slot is in the available list
const isAvailable = await CalendarService.checkTimeSlotValidityAndAvailability(
    calendar._id, 
    startDt, 
    endDt, 
    employee.teamupSubCalendarId
);
if (!isAvailable) → Error
```

#### Step 5: Create in Teamup

```javascript
// Create event in external Teamup calendar
const teamupEvent = await TeamupService.createEvent(
    calendar.teamupSecretCalendarKey,
    calendar.teamupApiKey,
    [employee.teamupSubCalendarId],
    `${customerName} - ${service.name}`,  // Title
    `Email: ${email}\nPhone: ${phone}`,   // Description
    startDt,
    endDt
);
// Returns teamupEvent.id which we store locally
```

#### Step 6: Save to Database

```javascript
// Create local event record
const newEvent = {
    calendarId: calendar._id,
    teamupSubCalendarIds: [employee.teamupSubCalendarId],
    start: startDt,
    end: endDt,
    allDay: false,
    teamupEventId: teamupEvent.id
};
await DbService.create(EVENTS, newEvent);
```

#### Step 7: Response + Async Tasks

```javascript
// Send response immediately
res.status(201).send(newEvent);

// Then asynchronously:
// 1. Send confirmation email
await EmailService.sendEmail(business, customerEmail, subject, message);

// 2. Store personal data
await DbService.create(PERSONAL_DATA, { email, phone, name });
```

---

## Flow 2: Getting Available Time Slots

This flow calculates which time slots are available for booking.

### Sequence Diagram

```
Customer          API              CalendarService      Database
   │               │                      │                │
   │ GET /event/   │                      │                │
   │ available     │                      │                │
   │──────────────▶│                      │                │
   │               │                      │                │
   │               │ getAvailableTimeSlots│                │
   │               │─────────────────────▶│                │
   │               │                      │                │
   │               │                      │ Get business   │
   │               │                      │───────────────▶│
   │               │                      │                │
   │               │                      │ Get calendar   │
   │               │                      │───────────────▶│
   │               │                      │                │
   │               │                      │ Get employee   │
   │               │                      │───────────────▶│
   │               │                      │                │
   │               │                      │ Get location   │
   │               │                      │───────────────▶│
   │               │                      │                │
   │               │                      │ Get events     │
   │               │                      │───────────────▶│
   │               │                      │                │
   │               │                      │                │
   │               │   Calculate slots    │                │
   │               │◀─────────────────────│                │
   │               │                      │                │
   │ Available slots                      │                │
   │◀──────────────│                      │                │
   │               │                      │                │
```

### Slot Calculation Algorithm

```
Input:
- Business config (slotTime, maximumDaysInFuture, minimumTimeSlotsInFuture)
- Location working hours
- Existing events
- Service duration

Algorithm:
1. FOR each day from today to today + maximumDaysInFuture:
   
   2. Skip if day is not in working hours
   
   3. FOR each working hour range on that day:
      
      4. Set currentTime = max(rangeStart, now + minimumAdvanceTime)
      
      5. WHILE currentTime + serviceDuration <= rangeEnd:
         
         6. Check if slot overlaps any existing event
         
         7. IF no overlap:
            Add slot to available list
         
         8. currentTime += serviceDuration
   
9. RETURN available slots
```

### Optimization Techniques Used

```javascript
// 1. Pre-process events into a map by day
const eventsByDay = {};
for (const event of events) {
    const dayKey = moment(event.start).format('YYYY-MM-DD');
    eventsByDay[dayKey].push(event);
}

// 2. Pre-process working hours into a lookup map
const workingHoursMap = {
    'monday': [{ open: 9, close: 12 }, { open: 14, close: 18 }],
    'tuesday': [{ open: 9, close: 18 }],
    // ...
};

// 3. Calculate slots to skip directly (avoid loop)
if (currentTime < minimumTimeAllowed) {
    const slotsToSkip = Math.ceil(diff / serviceDuration);
    currentTime.add(slotsToSkip * serviceDuration, 'minutes');
}

// 4. Only check events for the current day
const dayEvents = eventsByDay[dayKey] || [];
```

### Example Output

```json
[
    {"start": "2024-01-15T09:00:00Z", "end": "2024-01-15T09:30:00Z"},
    {"start": "2024-01-15T09:30:00Z", "end": "2024-01-15T10:00:00Z"},
    // Gap - existing event at 10:00-10:30
    {"start": "2024-01-15T10:30:00Z", "end": "2024-01-15T11:00:00Z"},
    {"start": "2024-01-15T11:00:00Z", "end": "2024-01-15T11:30:00Z"}
]
```

---

## Flow 3: Calendar Synchronization

Keeps local database in sync with Teamup calendar.

### When Sync Happens

1. **Server Startup** - `syncAllCalendars()` runs on initialization
2. **Webhook Received** - Individual calendar syncs on event changes
3. **Recurring Events** - Full sync when recurring events change

### Full Sync Flow

```
Server Start      CalendarService      TeamupService       Database
     │                  │                    │                │
     │ syncAllCalendars │                    │                │
     │─────────────────▶│                    │                │
     │                  │                    │                │
     │                  │ FOR each calendar: │                │
     │                  │                    │                │
     │                  │ Set status=inactive│                │
     │                  │───────────────────────────────────▶│
     │                  │                    │                │
     │                  │ Get events since   │                │
     │                  │ lastSynchronized   │                │
     │                  │───────────────────▶│                │
     │                  │    [events]        │                │
     │                  │◀───────────────────│                │
     │                  │                    │                │
     │                  │ FOR each event:    │                │
     │                  │   Delete old       │                │
     │                  │   Create new       │                │
     │                  │───────────────────────────────────▶│
     │                  │                    │                │
     │                  │ Delete orphan events                │
     │                  │───────────────────────────────────▶│
     │                  │                    │                │
     │                  │ Set status=active  │                │
     │                  │ Set lastSynchronized               │
     │                  │───────────────────────────────────▶│
     │                  │                    │                │
```

### Sync Strategy

```javascript
// 1. Mark calendar as inactive during sync
await DbService.update(CALENDARS, { _id: calendarId }, { status: "inactive" });

// 2. Get events from Teamup (since last sync)
const teamupEvents = await TeamupService.getInitialEvents(
    calendar.teamupSecretCalendarKey,
    calendar.teamupApiKey,
    lastSyncDate
);

// 3. Process each event
for (let event of teamupEvents) {
    usedIds.push(event.id);
    
    // Delete existing (handles updates)
    await DbService.deleteMany(EVENTS, { teamupEventId: event.id });
    
    // Skip if deleted in Teamup
    if (event.deleted_dt) continue;
    
    // Create fresh copy
    await DbService.create(EVENTS, newEvent);
}

// 4. Delete events not in Teamup anymore
await DbService.deleteMany(EVENTS, {
    calendarId: calendarId,
    teamupEventId: { $nin: usedIds }
});

// 5. Mark calendar active and update timestamp
await DbService.update(CALENDARS, { _id: calendarId }, { 
    lastSynchronized: new Date(),
    status: "active"
});
```

### Webhook-Triggered Sync

```
Teamup              API/Webhook         CalendarService        Database
   │                    │                     │                   │
   │ POST /webhook/event│                     │                   │
   │───────────────────▶│                     │                   │
   │                    │                     │                   │
   │                    │ Verify signature    │                   │
   │                    │ (HMAC-SHA256)       │                   │
   │                    │                     │                   │
   │                    │ Parse trigger       │                   │
   │                    │ (created/modified/  │                   │
   │                    │  removed)           │                   │
   │                    │                     │                   │
   │                    │ IF recurring event: │                   │
   │                    │   syncCalendar()    │                   │
   │                    │────────────────────▶│                   │
   │                    │                     │                   │
   │                    │ ELSE:               │                   │
   │                    │   Direct DB update  │                   │
   │                    │─────────────────────────────────────────▶
   │                    │                     │                   │
   │     200 OK         │                     │                   │
   │◀───────────────────│                     │                   │
   │                    │                     │                   │
```

---

## Flow 4: Business Page Load

When a customer visits a business booking page.

### Sequence Diagram

```
Customer          Web App            API               Database
   │                │                 │                   │
   │ Visit page     │                 │                   │
   │───────────────▶│                 │                   │
   │                │                 │                   │
   │                │ GET /business/  │                   │
   │                │ {domain}        │                   │
   │                │────────────────▶│                   │
   │                │                 │                   │
   │                │                 │ Find business by  │
   │                │                 │ website (regex)   │
   │                │                 │──────────────────▶│
   │                │                 │                   │
   │                │                 │ Get services      │
   │                │                 │──────────────────▶│
   │                │                 │                   │
   │                │                 │ Get locations     │
   │                │                 │──────────────────▶│
   │                │                 │                   │
   │                │                 │ Get employees     │
   │                │                 │──────────────────▶│
   │                │                 │                   │
   │                │                 │ Get calendar      │
   │                │                 │──────────────────▶│
   │                │                 │                   │
   │                │ Business data   │                   │
   │                │◀────────────────│                   │
   │                │                 │                   │
   │ Render page    │                 │                   │
   │◀───────────────│                 │                   │
   │                │                 │                   │
```

### Data Aggregation

```javascript
// Start with business lookup (regex for partial domain match)
const business = await DbService.getOne(BUSINESSES, { 
    website: { "$regex": tld, "$options": 'i' } 
});

// Build comprehensive response
const businessInfo = {
    // Core business info (omit sensitive fields)
    name: business.name,
    description: business.description,
    logo: business.logo,
    // ... other public fields
    
    // Related data (parallel queries would be more efficient)
    services: await DbService.getMany(SERVICES, { 
        businessId: business._id, 
        status: 'active' 
    }),
    
    locations: await DbService.getMany(LOCATIONS, { 
        businessId: business._id, 
        status: 'active' 
    }),
    
    employees: await DbService.getMany(EMPLOYEES, { 
        businessId: business._id, 
        status: 'active' 
    }),
    
    calendar: await DbService.getOne(CALENDARS, { 
        businessId: business._id 
    })
};
```

---

## Error Flow

How errors propagate through the system.

```
Any Layer         Route Handler       Error Handler       Logger          Client
    │                  │                   │                 │               │
    │ throw Error      │                   │                 │               │
    │─────────────────▶│                   │                 │               │
    │                  │                   │                 │               │
    │                  │ next(error)       │                 │               │
    │                  │─────────────────▶│                 │               │
    │                  │                   │                 │               │
    │                  │                   │ Log error       │               │
    │                  │                   │────────────────▶│               │
    │                  │                   │                 │               │
    │                  │                   │                 │ Write to      │
    │                  │                   │                 │ console/file  │
    │                  │                   │                 │               │
    │                  │                   │ Format response │               │
    │                  │                   │─────────────────────────────────▶
    │                  │                   │                 │               │
```

### Error Response Format

```javascript
// Input: ResponseError with message and status
// Output:
{
    status: 400,
    error: "\"name\" length must be at least 3 characters long",
    dt: 1705312345678  // Timestamp for debugging
}
```

---

## Data Flow Patterns

### Pattern 1: Validate Before Process

Every write operation follows this pattern:

```
1. Validate request body (Joi)
2. Validate referenced entities exist
3. Validate business rules
4. Perform operation
5. Return response
```

### Pattern 2: Soft Delete

Entities are never physically deleted:

```
Instead of:  DELETE FROM table WHERE id = ?
We do:       UPDATE table SET status = 'deleted' WHERE id = ?

Queries filter:
- Active only: { status: 'active' }
- All visible: { status: { $ne: 'deleted' } }
```

### Pattern 3: Business Isolation

All queries filter by businessId:

```javascript
// Getting services for a business
DbService.getMany(SERVICES, { 
    businessId: business._id, 
    status: 'active' 
});

// Validating employee belongs to business
if (employee.businessId.toString() !== business._id.toString()) {
    throw new Error('Employee does not belong to business');
}
```

### Pattern 4: Fire and Forget

Some operations happen after the response:

```javascript
// Send response first
res.status(201).send(result);

// Then do async tasks (no await, no error catching for client)
EmailService.sendEmail(...);
DbService.create(PERSONAL_DATA, ...);
```

**Note:** This pattern is used for non-critical operations. Failures are logged but don't affect the user experience.

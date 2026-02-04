# GoBarber Mobile Application - Product Requirements Document

**Version:** 1.0.0  
**Date:** 2026-02-04  
**Status:** Approved for Implementation  
**Author:** BMad Master (Party Mode Session)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Technical Architecture](#3-technical-architecture)
4. [User Roles & Flows](#4-user-roles--flows)
5. [Screen Specifications](#5-screen-specifications)
6. [Data Models](#6-data-models)
7. [Mock Data Requirements](#7-mock-data-requirements)
8. [Localization](#8-localization)
9. [Theming & Branding](#9-theming--branding)
10. [Offline-First Strategy](#10-offline-first-strategy)
11. [Edge Cases & Error Handling](#11-edge-cases--error-handling)
12. [Implementation Phases](#12-implementation-phases)

---

## 1. Executive Summary

**GoBarber** is a React Native mobile application for appointment booking, serving both customers and business administrators through a single codebase with role-based switching.

### Key Features
- Multi-business support via business codes
- Customer booking flow with smart step-skipping
- Full admin control panel with visual calendar
- Offline-first architecture
- Bilingual support (Bulgarian default, English)
- Business-customizable theming (colors, logo)
- Playful, modern UI with animations

### Target Platforms
- iOS (via Expo)
- Android (via Expo)

---

## 2. Project Overview

### 2.1 Problem Statement

Businesses need a mobile solution for their customers to book appointments while also providing administrators with a management interface. The current web solution serves customers but lacks mobile convenience and admin capabilities.

### 2.2 Solution

A unified mobile application that:
1. Allows customers to enter a business code and book appointments
2. Provides administrators with full business management
3. Remembers user preferences for faster repeat bookings
4. Works offline with data synchronization

### 2.3 Success Metrics (Post-MVP)
- Booking completion rate > 80%
- App load time < 2 seconds
- Offline capability for core flows

---

## 3. Technical Architecture

### 3.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native |
| Build System | Expo SDK 52+ |
| Navigation | Expo Router (file-based) |
| State Management | Zustand |
| Local Storage | AsyncStorage + MMKV |
| Animations | React Native Reanimated + Lottie |
| i18n | i18next + react-i18next |
| Calendar | react-native-calendars |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios (mocked for MVP) |

### 3.2 Project Structure

```
mobile/
├── app/                          # Expo Router pages
│   ├── (auth)/                   # Auth screens (business code entry)
│   │   ├── index.tsx             # GoBarber entry screen
│   │   └── admin-login.tsx       # Admin password screen
│   ├── (customer)/               # Customer tab navigator
│   │   ├── _layout.tsx           # Tab layout
│   │   ├── book/                 # Booking flow stack
│   │   │   ├── index.tsx         # Start/Location selection
│   │   │   ├── employee.tsx
│   │   │   ├── service.tsx
│   │   │   ├── datetime.tsx
│   │   │   ├── personal-data.tsx
│   │   │   ├── confirmation.tsx
│   │   │   └── success.tsx
│   │   ├── appointments/
│   │   │   ├── index.tsx         # Tabs: upcoming/past
│   │   │   └── [id].tsx          # Appointment detail
│   │   └── settings/
│   │       └── index.tsx
│   └── (admin)/                  # Admin tab navigator
│       ├── _layout.tsx
│       ├── dashboard/
│       │   └── index.tsx
│       ├── calendar/
│       │   └── index.tsx
│       ├── appointments/
│       │   ├── index.tsx
│       │   ├── [id].tsx
│       │   └── create.tsx
│       └── settings/
│           ├── index.tsx
│           ├── business-info.tsx
│           ├── working-hours.tsx
│           ├── employees.tsx
│           └── branding.tsx
├── components/
│   ├── ui/                       # Base UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Calendar.tsx
│   │   ├── TimeSlotGrid.tsx
│   │   ├── ProgressBar.tsx
│   │   └── ...
│   ├── booking/                  # Booking-specific components
│   │   ├── LocationCard.tsx
│   │   ├── EmployeeCard.tsx
│   │   ├── ServiceCard.tsx
│   │   └── AppointmentCard.tsx
│   ├── admin/                    # Admin-specific components
│   │   ├── DashboardStats.tsx
│   │   ├── CalendarView.tsx
│   │   └── AppointmentListItem.tsx
│   └── common/
│       ├── Header.tsx
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       └── ConfettiAnimation.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useBusiness.ts
│   ├── useBooking.ts
│   ├── useAppointments.ts
│   └── useTheme.ts
├── stores/
│   ├── authStore.ts              # Business code, role, admin session
│   ├── businessStore.ts          # Business data cache
│   ├── bookingStore.ts           # Current booking state
│   ├── userPreferencesStore.ts   # Last selections, personal data
│   └── appointmentsStore.ts      # Appointments cache
├── services/
│   ├── api/
│   │   ├── client.ts             # Axios instance
│   │   ├── business.api.ts
│   │   ├── booking.api.ts
│   │   └── appointments.api.ts
│   └── mock/
│       ├── mockData.ts           # All mock data
│       ├── mockHandlers.ts       # Mock API responses
│       └── delays.ts             # Simulate network latency
├── i18n/
│   ├── index.ts
│   ├── bg.json
│   └── en.json
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── ThemeProvider.tsx
├── utils/
│   ├── storage.ts
│   ├── calendar.ts
│   ├── validation.ts
│   └── formatters.ts
├── constants/
│   └── index.ts
├── types/
│   └── index.ts
├── assets/
│   ├── images/
│   ├── animations/               # Lottie files
│   └── fonts/
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

### 3.3 Navigation Architecture

```
Root Navigator
├── (auth) - Stack Navigator [shown when no business code]
│   ├── index (GoBarber Entry)
│   └── admin-login
│
├── (customer) - Tab Navigator [shown when role=customer]
│   ├── Book Tab - Stack Navigator
│   │   ├── index (Location or auto-skip)
│   │   ├── employee
│   │   ├── service
│   │   ├── datetime
│   │   ├── personal-data
│   │   ├── confirmation
│   │   └── success
│   ├── Appointments Tab - Stack Navigator
│   │   ├── index (tabs: upcoming/past)
│   │   └── [id] (detail)
│   └── Settings Tab
│       └── index
│
└── (admin) - Tab Navigator [shown when role=admin]
    ├── Dashboard Tab
    │   └── index
    ├── Calendar Tab
    │   └── index
    ├── Appointments Tab - Stack Navigator
    │   ├── index (list)
    │   ├── [id] (detail/edit)
    │   └── create
    └── Settings Tab - Stack Navigator
        ├── index
        ├── business-info
        ├── working-hours
        ├── employees
        └── branding
```

---

## 4. User Roles & Flows

### 4.1 Role Determination Flow

```
App Launch
    │
    ▼
Has stored business code?
    │
    ├── NO ──► Show GoBarber Entry Screen
    │              │
    │              ├── Enter code + Submit ──► Customer App
    │              │
    │              └── "I am a business" ──► Admin Login
    │                      │
    │                      └── Code + Password ──► Admin App
    │
    └── YES ──► Check stored role
                    │
                    ├── Customer ──► Customer Tab Navigator
                    │
                    └── Admin ──► Admin Tab Navigator
```

### 4.2 Customer Booking Flow

```
Start Booking
    │
    ▼
Multiple locations?
    ├── YES ──► Location Selection Screen
    │               │
    │               ▼
    └── NO (skip) ──► Auto-select single location
                          │
                          ▼
Multiple employees at location?
    ├── YES ──► Employee Selection Screen
    │               │ (includes "Anyone available" as first option)
    │               ▼
    └── NO (skip) ──► Auto-select single employee
                          │
                          ▼
Multiple services for employee?
    ├── YES ──► Service Selection Screen
    │               │
    │               ▼
    └── NO (skip) ──► Auto-select single service
                          │
                          ▼
                Date & Time Selection
                          │
                          ▼
                Personal Data Form
                (pre-filled if returning user)
                          │
                          ▼
                Confirmation Screen
                          │
                          ▼
                Submit Booking (mocked)
                          │
                          ▼
                Success Screen
                (confetti + add to calendar)
```

### 4.3 "Anyone Available" Logic

When customer selects "Anyone available":
1. Proceed to service selection
2. Proceed to date/time selection
3. Show ALL available slots across ALL employees
4. On slot selection, system assigns the employee who has that slot
5. Display assigned employee on confirmation screen

### 4.4 Admin Flow

```
Admin Login
    │
    ▼
Dashboard (Today's overview)
    │
    ├── View Calendar ──► Calendar Tab
    │       │
    │       ├── Tap empty slot ──► Quick booking modal
    │       │
    │       └── Tap existing ──► View/Edit appointment
    │
    ├── Appointments List ──► Appointments Tab
    │       │
    │       ├── Search/Filter
    │       ├── View details
    │       ├── Edit
    │       ├── Cancel
    │       └── Call customer
    │
    └── Settings ──► Settings Tab
            │
            ├── Business Info (view/edit)
            ├── Working Hours (edit)
            ├── Employees (CRUD)
            └── Branding (colors, logo)
```

---

## 5. Screen Specifications

### 5.1 Auth Screens

#### 5.1.1 GoBarber Entry Screen

**Route:** `/(auth)/index`

**Purpose:** First-time entry point for both customers and admins

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│           [GoBarber Logo]           │
│                                     │
│            "GoBarber"               │
│    "Вашият партньор за резервации"  │
│                                     │
│                                     │
│   "Въведете код на бизнес"          │
│   ┌─────────────────────────────┐   │
│   │  [Business Code Input]      │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │      [Продължи Button]      │   │
│   └─────────────────────────────┘   │
│                                     │
│                                     │
│        "Аз съм бизнес" (link)       │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Input validation: non-empty, alphanumeric
- On submit: validate code against mock data
- Success: store code, navigate to customer app
- Error: show "Invalid code" message
- "I am a business" link navigates to admin-login

**Localization:**
- Title: `auth.entry.title`
- Subtitle: `auth.entry.subtitle`
- Placeholder: `auth.entry.codePlaceholder`
- Button: `auth.entry.submit`
- Admin link: `auth.entry.iAmBusiness`

---

#### 5.1.2 Admin Login Screen

**Route:** `/(auth)/admin-login`

**Layout:**
```
┌─────────────────────────────────────┐
│  ←                                  │
│                                     │
│        [Business Logo/Icon]         │
│                                     │
│     "Вход за администратор"         │
│                                     │
│   Код на бизнес                     │
│   ┌─────────────────────────────┐   │
│   │  [Code Input]               │   │
│   └─────────────────────────────┘   │
│                                     │
│   Парола                            │
│   ┌─────────────────────────────┐   │
│   │  [Password Input]           │   │
│   └─────────────────────────────┘   │
│                                     │
│   ┌─────────────────────────────┐   │
│   │        [Вход Button]        │   │
│   └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Validate code + password against mock admin credentials
- Success: store code + role=admin, navigate to admin app
- Error: show "Invalid credentials"

---

### 5.2 Customer Booking Screens

#### 5.2.1 Location Selection

**Route:** `/(customer)/book/index`

**Skip condition:** Only 1 active location

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Резервация            Стъпка 1/6 │
│  ━━━━━━░░░░░░░░░░░░░░░░░░░ 16%     │
│                                     │
│  "Изберете локация"                 │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📍 Downtown Branch          │    │
│  │    123 Main Street          │    │
│  │    ✓ Последно избрано       │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 📍 Mall Location            │    │
│  │    456 Shopping Ave         │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         [Напред]            │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Behavior:**
- Show all active locations
- Highlight last-selected location (from preferences store)
- On select: update booking store, enable "Next" button
- On next: navigate to employee selection

**Components:**
- `LocationCard`: icon, name, address, selected state, last-selected badge

---

#### 5.2.2 Employee Selection

**Route:** `/(customer)/book/employee`

**Skip condition:** Only 1 active employee at selected location

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Резервация            Стъпка 2/6 │
│  ━━━━━━━━━━━░░░░░░░░░░░░░░ 33%     │
│                                     │
│  "Изберете специалист"              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 👤 Който е свободен         │    │
│  │    Ще ви свържем с първия   │    │
│  │    свободен специалист      │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 👤 John Stylist             │    │
│  │    ✓ Последно избрано       │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 👤 Jane Colorist            │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         [Напред]            │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Behavior:**
- "Anyone available" always first option (special ID: `ANYONE`)
- Filter employees by selected location
- Show last-selected employee (if not "anyone")
- Store selection in booking store

---

#### 5.2.3 Service Selection

**Route:** `/(customer)/book/service`

**Skip condition:** Selected employee offers only 1 service

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Резервация            Стъпка 3/6 │
│  ━━━━━━━━━━━━━━━░░░░░░░░░░ 50%     │
│                                     │
│  "Изберете услуга"                  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ✂️ Подстригване              │    │
│  │    25.00 лв. • 30 мин       │    │
│  │    ✓ Последно избрано       │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🎨 Боядисване               │    │
│  │    45.00 лв. • 60 мин       │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 💈 Подстригване + Брада     │    │
│  │    35.00 лв. • 45 мин       │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         [Напред]            │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Behavior:**
- If employee selected: show only their services
- If "Anyone": show all services, later filter employees who offer it
- Show price (formatted) and duration
- Store selection

---

#### 5.2.4 Date & Time Selection

**Route:** `/(customer)/book/datetime`

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Резервация            Стъпка 4/6 │
│  ━━━━━━━━━━━━━━━━━━░░░░░░░ 66%     │
│                                     │
│  "Изберете дата и час"              │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      < Февруари 2026 >      │    │
│  │  П   В   С   Ч   П   С   Н  │    │
│  │                  1   2      │    │
│  │  3   4   5   6   7   8   9  │    │
│  │  10  11  12  13 [14] 15  16 │    │
│  │  17  18  19  20  21  22  23 │    │
│  │  24  25  26  27  28         │    │
│  └─────────────────────────────┘    │
│                                     │
│  Свободни часове за 14 Фев:         │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │09:00 │ │09:30 │ │10:00 │        │
│  └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │10:30 │ │11:00 │ │14:00 │        │
│  └──────┘ └──────┘ └──────┘        │
│  ┌──────┐ ┌──────┐                 │
│  │14:30 │ │15:00 │                 │
│  └──────┘ └──────┘                 │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         [Напред]            │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Behavior:**
- Calendar shows dates with available slots (others disabled/strikethrough)
- Date selection loads time slots for that day
- Time slot selection enables "Next" button
- If "Anyone" was selected, time slots aggregate from all matching employees
- Store selected date + time + assigned employee (if "Anyone")

**Empty state:** "Няма свободни часове за избрания период"

---

#### 5.2.5 Personal Data Form

**Route:** `/(customer)/book/personal-data`

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Резервация            Стъпка 5/6 │
│  ━━━━━━━━━━━━━━━━━━━━━░░░░ 83%     │
│                                     │
│  "Вашите данни"                     │
│                                     │
│  Име *                              │
│  ┌─────────────────────────────┐    │
│  │  [Pre-filled if returning]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Телефон *                          │
│  ┌─────────────────────────────┐    │
│  │  [Pre-filled if returning]  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Имейл *                            │
│  ┌─────────────────────────────┐    │
│  │  [Pre-filled if returning]  │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         [Напред]            │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Behavior:**
- Pre-fill from userPreferencesStore if available
- Validate: name required, phone required, email required + valid format
- On submit: save to preferences store for future visits

**Validation messages:**
- Name: "Името е задължително"
- Phone: "Телефонът е задължителен"
- Email: "Имейлът е задължителен" / "Невалиден имейл"

---

#### 5.2.6 Confirmation Screen

**Route:** `/(customer)/book/confirmation`

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Резервация            Стъпка 6/6 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━░ 95%     │
│                                     │
│  "Потвърдете резервацията"          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  📍 Downtown Branch         │    │
│  │  👤 John Stylist            │    │
│  │  ✂️ Подстригване             │    │
│  │                             │    │
│  │  ─────────────────────────  │    │
│  │                             │    │
│  │  📅 14 Февруари 2026        │    │
│  │  🕐 10:00                   │    │
│  │  💰 25.00 лв.               │    │
│  │                             │    │
│  │  ─────────────────────────  │    │
│  │                             │    │
│  │  Иван Иванов                │    │
│  │  +359 888 123 456           │    │
│  │  ivan@email.com             │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ☑ Съгласен съм с Политика за      │
│    поверителност                    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   [Потвърди резервация]     │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

**Behavior:**
- Display all booking details as summary
- Privacy policy checkbox required
- Privacy policy link opens business's privacyPolicyURL
- Submit button disabled until checkbox checked
- On submit: call mock API, navigate to success

---

#### 5.2.7 Success Screen

**Route:** `/(customer)/book/success`

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│                                     │
│         [Confetti Animation]        │
│                                     │
│              🎉 ✨ 🎊               │
│                                     │
│      "Успешна резервация!"          │
│                                     │
│   Ще получите потвърждение на:      │
│        ivan@email.com               │
│                                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  📅 Добави в календар       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🏠 Към началото            │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Play confetti Lottie animation on mount
- "Add to calendar" uses device calendar API (expo-calendar)
- "Go home" resets booking store, navigates to book index

---

### 5.3 Customer Appointments Screens

#### 5.3.1 Appointments List

**Route:** `/(customer)/appointments/index`

**Layout:**
```
┌─────────────────────────────────────┐
│           Резервации                │
│                                     │
│  ┌────────────────┬────────────┐    │
│  │  Предстоящи    │   Минали   │    │
│  └────────────────┴────────────┘    │
│                                     │
│  [Upcoming tab content:]            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ✂️ Подстригване              │    │
│  │ 📅 14 Фев 2026, 10:00       │    │
│  │ 📍 Downtown Branch          │    │
│  │ 👤 John Stylist             │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Past tab content:]                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🎨 Боядисване    [Завършен] │    │
│  │ 📅 01 Яну 2026, 14:00       │    │
│  │ 📍 Downtown Branch          │    │
│  │                             │    │
│  │ ┌─────────────────────────┐ │    │
│  │ │   [Запази отново]       │ │    │
│  │ └─────────────────────────┘ │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Tabs switch between upcoming and past
- "Book Again" on past appointments pre-fills booking with same selections
- Tap card navigates to detail screen
- Empty state: "Все още нямате резервации. Нека да поправим това! 💇"

---

#### 5.3.2 Appointment Detail

**Route:** `/(customer)/appointments/[id]`

**Layout:**
```
┌─────────────────────────────────────┐
│  ←       Детайли на резервация      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  ✂️ Подстригване             │    │
│  │                             │    │
│  │  📅 14 Февруари 2026        │    │
│  │  🕐 10:00 - 10:30           │    │
│  │                             │    │
│  │  📍 Downtown Branch         │    │
│  │     123 Main Street         │    │
│  │                             │    │
│  │  👤 John Stylist            │    │
│  │                             │    │
│  │  💰 25.00 лв.               │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  [For upcoming appointments:]       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  📅 Добави в календар       │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  ❌ Откажи резервация       │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Show full appointment details
- For upcoming: show "Add to calendar" and "Cancel" actions
- Cancel shows confirmation dialog
- For past: show "Book Again" button

---

### 5.4 Customer Settings Screen

**Route:** `/(customer)/settings/index`

**Layout:**
```
┌─────────────────────────────────────┐
│           Настройки                 │
│                                     │
│  Език / Language                    │
│  ┌─────────────────────────────┐    │
│  │ 🇧🇬 Български           ▼   │    │
│  └─────────────────────────────┘    │
│                                     │
│  Известия                           │
│  ┌─────────────────────────────┐    │
│  │ Push известия           ◯   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Напомняне преди час     ◯   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🚪 Напусни бизнес           │    │
│  │    (Elegant Hair Studio)    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Версия: 1.0.0                      │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Language picker: BG (default), EN
- Language change triggers i18n reload
- "Leave business" shows confirmation dialog
  - Confirm: clears local cache (code, preferences, appointments)
  - Navigate back to GoBarber entry screen
- Notification toggles (mocked for MVP)

---

### 5.5 Admin Screens

#### 5.5.1 Dashboard

**Route:** `/(admin)/dashboard/index`

**Layout:**
```
┌─────────────────────────────────────┐
│         Табло • 14 Фев              │
│                                     │
│  ┌─────────────┐ ┌─────────────┐    │
│  │     12      │ │      3      │    │
│  │ Резервации  │ │  Свободни   │    │
│  │   днес      │ │   слота     │    │
│  └─────────────┘ └─────────────┘    │
│                                     │
│  ┌─────────────┐ ┌─────────────┐    │
│  │   1,250     │ │      2      │    │
│  │   лв.       │ │  Отказани   │    │
│  │ очаквани    │ │   днес      │    │
│  └─────────────┘ └─────────────┘    │
│                                     │
│  Следващи резервации                │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 10:00  Иван Иванов          │    │
│  │        ✂️ Подстригване       │    │
│  │        👤 John Stylist      │    │
│  └─────────────────────────────┘    │
│  ┌─────────────────────────────┐    │
│  │ 10:30  Мария Петрова        │    │
│  │        🎨 Боядисване        │    │
│  │        👤 Jane Colorist     │    │
│  └─────────────────────────────┘    │
│                                     │
│  Quick Actions                      │
│  ┌─────────────┐ ┌─────────────┐    │
│  │ + Блокирай  │ │ + Почивка   │    │
│  │   време     │ │             │    │
│  └─────────────┘ └─────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Stats cards show today's metrics
- Upcoming list shows next 5-10 appointments
- Tap appointment navigates to detail
- Quick actions open modals for blocking time

---

#### 5.5.2 Calendar View

**Route:** `/(admin)/calendar/index`

**Layout:**
```
┌─────────────────────────────────────┐
│           Календар                  │
│                                     │
│  Employee: ┌──────────────────┐     │
│            │ Всички       ▼   │     │
│            └──────────────────┘     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Day │ Week │ Month          │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │     < 14 Февруари 2026 >    │    │
│  └─────────────────────────────┘    │
│                                     │
│  08:00 ░░░░░░░░░░░░░░░░░░░░░░░     │
│  09:00 ████ Иван - Подстригване     │
│  09:30 ████ (continues)             │
│  10:00 ████ Мария - Боядисване      │
│  10:30 ████ (continues)             │
│  11:00 ████ (continues)             │
│  11:30 ░░░░░░░░░░░░░░░░░░░░░░░     │
│  12:00 ▓▓▓▓ LUNCH BREAK             │
│  12:30 ▓▓▓▓ (blocked)               │
│  13:00 ░░░░░░░░░░░░░░░░░░░░░░░     │
│                                     │
│  Legend: ░ Available █ Booked ▓ Block│
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Filter by employee or show all (side-by-side columns)
- View toggle: Day, Week, Month
- Tap empty slot: open quick booking modal
- Tap booked slot: view/edit appointment
- Tap blocked slot: option to unblock
- Swipe to change date

---

#### 5.5.3 Admin Appointments List

**Route:** `/(admin)/appointments/index`

**Layout:**
```
┌─────────────────────────────────────┐
│           Резервации                │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🔍 Търсене...                 │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌──────┬──────────┬──────────┐     │
│  │ Днес │Предстоящи│  Минали  │     │
│  └──────┴──────────┴──────────┘     │
│                                     │
│  Employee: ┌──────────────────┐     │
│            │ Всички       ▼   │     │
│            └──────────────────┘     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Иван Иванов                 │    │
│  │ ✂️ Подстригване • 10:00      │    │
│  │ 📱 +359 888 123 456         │    │
│  │ 👤 John Stylist             │    │
│  │                             │    │
│  │ [📞 Call] [✏️ Edit] [❌ Cancel]│   │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Мария Петрова               │    │
│  │ 🎨 Боядисване • 10:30       │    │
│  │ 📱 +359 888 456 789         │    │
│  │ 👤 Jane Colorist            │    │
│  │                             │    │
│  │ [📞 Call] [✏️ Edit] [❌ Cancel]│   │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   + Добави резервация       │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Search by customer name, phone, email
- Tabs: Today, Upcoming, Past
- Filter by employee
- Action buttons: Call (opens phone), Edit, Cancel
- FAB or button to create new booking

---

#### 5.5.4 Admin Create Appointment

**Route:** `/(admin)/appointments/create`

**Purpose:** Walk-in customers or phone bookings

**Layout:**
```
┌─────────────────────────────────────┐
│  ←     Нова резервация              │
│                                     │
│  Клиент                             │
│                                     │
│  Име *                              │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Телефон *                          │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Имейл                              │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Резервация                         │
│                                     │
│  Локация *                          │
│  ┌─────────────────────────────┐    │
│  │ Downtown Branch         ▼   │    │
│  └─────────────────────────────┘    │
│                                     │
│  Специалист *                       │
│  ┌─────────────────────────────┐    │
│  │ John Stylist            ▼   │    │
│  └─────────────────────────────┘    │
│                                     │
│  Услуга *                           │
│  ┌─────────────────────────────┐    │
│  │ Подстригване            ▼   │    │
│  └─────────────────────────────┘    │
│                                     │
│  Дата *                             │
│  ┌─────────────────────────────┐    │
│  │ 14 Февруари 2026        📅  │    │
│  └─────────────────────────────┘    │
│                                     │
│  Час *                              │
│  ┌─────────────────────────────┐    │
│  │ 10:00                   ▼   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │      [Създай резервация]    │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- All fields except email required
- Dropdowns filter based on previous selections
- Time dropdown shows only available slots
- On create: add to mock appointments, navigate back

---

#### 5.5.5 Admin Settings

**Route:** `/(admin)/settings/index`

**Layout:**
```
┌─────────────────────────────────────┐
│           Настройки                 │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🏢 Информация за бизнеса    │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🕐 Работно време            │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 👥 Служители                │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🎨 Брандиране               │    │
│  │    (цветове, лого)          │    │
│  │                         ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Език / Language                    │
│  ┌─────────────────────────────┐    │
│  │ 🇧🇬 Български           ▼   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ 🚪 Изход                    │    │
│  └─────────────────────────────┘    │
│                                     │
│  Версия: 1.0.0                      │
│                                     │
└─────────────────────────────────────┘
```

---

#### 5.5.6 Branding Settings

**Route:** `/(admin)/settings/branding`

**Layout:**
```
┌─────────────────────────────────────┐
│  ←        Брандиране                │
│                                     │
│  Лого                               │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      [Current Logo]         │    │
│  │                             │    │
│  │   [Смени лого]              │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Основен цвят                       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ ■ #00ACC2               ▶   │    │
│  └─────────────────────────────┘    │
│                                     │
│  Preview:                           │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │  [Button Preview]           │    │
│  │  [Progress Bar Preview]     │    │
│  │  [Tab Bar Preview]          │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │         [Запази]            │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Behavior:**
- Logo picker opens image picker
- Color picker with common presets + custom hex input
- Live preview of how colors will look
- Save updates mock business data + local theme

---

## 6. Data Models

### 6.1 Type Definitions

```typescript
// types/index.ts

// ============ BUSINESS ============
export interface Business {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
  };
  URLpostfix: string;
  slotTime: number; // minutes
  maximumDaysInFuture: number;
  minimumTimeSlotsInFuture: number;
  status: 'active' | 'inactive' | 'deleted';
  privacyPolicyURL?: string;
  branding: {
    primaryColor: string; // hex
    logo?: string;
  };
  // Admin credentials (mock only)
  adminPassword?: string;
}

// ============ LOCATION ============
export interface Location {
  _id: string;
  name: string;
  addressName: string;
  lat: number;
  lon: number;
  phone: string;
  businessId: string;
  employees: string[]; // Employee IDs
  workingHours: WorkingHour[];
  status: 'active' | 'inactive' | 'deleted';
}

export interface WorkingHour {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  open: string; // HH:mm
  close: string; // HH:mm
}

// ============ EMPLOYEE ============
export interface Employee {
  _id: string;
  name: string;
  teamupSubCalendarId?: number;
  businessId: string;
  services: string[]; // Service IDs
  status: 'active' | 'inactive' | 'deleted';
  avatar?: string;
  vacation?: {
    start: string; // ISO date
    end: string; // ISO date
  };
}

// ============ SERVICE ============
export interface Service {
  _id: string;
  name: string;
  price: number;
  priceFormatted: string; // "25.00 лв."
  currency: string;
  timeSlots: number;
  durationMinutes: number; // calculated: timeSlots * business.slotTime
  businessId: string;
  status: 'active' | 'inactive' | 'deleted';
  icon?: string; // emoji
}

// ============ APPOINTMENT ============
export interface Appointment {
  _id: string;
  calendarId: string;
  locationId: string;
  employeeId: string;
  serviceId: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  status: 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  createdBy: 'customer' | 'admin';
}

// ============ TIME SLOT ============
export interface TimeSlot {
  start: string; // ISO datetime
  end: string; // ISO datetime
  employeeId?: string; // assigned when "anyone" selected
}

// ============ USER PREFERENCES ============
export interface UserPreferences {
  lastLocationId?: string;
  lastEmployeeId?: string;
  lastServiceId?: string;
  personalData?: {
    name: string;
    phone: string;
    email: string;
  };
}

// ============ AUTH STATE ============
export interface AuthState {
  businessCode: string | null;
  role: 'customer' | 'admin' | null;
  business: Business | null;
  isLoading: boolean;
}

// ============ BOOKING STATE ============
export interface BookingState {
  locationId: string | null;
  employeeId: string | null; // 'ANYONE' for anyone available
  serviceId: string | null;
  date: string | null; // YYYY-MM-DD
  timeSlot: TimeSlot | null;
  personalData: {
    name: string;
    phone: string;
    email: string;
  } | null;
  assignedEmployeeId: string | null; // resolved when "anyone" + time selected
}
```

---

## 7. Mock Data Requirements

### 7.1 Mock Businesses

```typescript
// services/mock/mockData.ts

export const MOCK_BUSINESSES: Business[] = [
  {
    _id: 'biz_001',
    name: 'Elegant Hair Studio',
    description: 'Premium hair styling services',
    URLpostfix: 'elegant-hair',
    slotTime: 15,
    maximumDaysInFuture: 30,
    minimumTimeSlotsInFuture: 4,
    status: 'active',
    phone: '+359 888 123 456',
    email: 'contact@eleganthair.com',
    website: 'https://eleganthair.com',
    privacyPolicyURL: 'https://eleganthair.com/privacy',
    branding: {
      primaryColor: '#00ACC2', // Cyan/teal from web
      logo: 'https://example.com/elegant-hair-logo.png'
    },
    adminPassword: 'admin123' // For mock admin login
  },
  {
    _id: 'biz_002',
    name: 'Downtown Barbers',
    description: 'Classic barbershop experience',
    URLpostfix: 'downtown-barbers',
    slotTime: 20,
    maximumDaysInFuture: 14,
    minimumTimeSlotsInFuture: 2,
    status: 'active',
    branding: {
      primaryColor: '#D4AF37', // Gold
      logo: 'https://example.com/downtown-barbers-logo.png'
    },
    adminPassword: 'admin456'
  }
];
```

### 7.2 Mock Locations

```typescript
export const MOCK_LOCATIONS: Location[] = [
  // Elegant Hair - 2 locations
  {
    _id: 'loc_001',
    name: 'Downtown Branch',
    addressName: '123 Main Street, Sofia Center',
    lat: 42.6977,
    lon: 23.3219,
    phone: '+359 888 111 222',
    businessId: 'biz_001',
    employees: ['emp_001', 'emp_002'],
    workingHours: [
      { day: 'monday', open: '09:00', close: '18:00' },
      { day: 'tuesday', open: '09:00', close: '18:00' },
      { day: 'wednesday', open: '09:00', close: '18:00' },
      { day: 'thursday', open: '09:00', close: '18:00' },
      { day: 'friday', open: '09:00', close: '17:00' },
      { day: 'saturday', open: '10:00', close: '14:00' }
      // Sunday closed
    ],
    status: 'active'
  },
  {
    _id: 'loc_002',
    name: 'Mall Paradise',
    addressName: 'Paradise Center, Floor 2',
    lat: 42.6567,
    lon: 23.2890,
    phone: '+359 888 333 444',
    businessId: 'biz_001',
    employees: ['emp_003'],
    workingHours: [
      { day: 'monday', open: '10:00', close: '21:00' },
      { day: 'tuesday', open: '10:00', close: '21:00' },
      { day: 'wednesday', open: '10:00', close: '21:00' },
      { day: 'thursday', open: '10:00', close: '21:00' },
      { day: 'friday', open: '10:00', close: '21:00' },
      { day: 'saturday', open: '10:00', close: '21:00' },
      { day: 'sunday', open: '10:00', close: '20:00' }
    ],
    status: 'active'
  },
  // Downtown Barbers - 1 location (auto-skip)
  {
    _id: 'loc_003',
    name: 'Main Shop',
    addressName: '456 Old Town Road',
    lat: 42.7000,
    lon: 23.3300,
    phone: '+359 888 555 666',
    businessId: 'biz_002',
    employees: ['emp_004'],
    workingHours: [
      { day: 'tuesday', open: '09:00', close: '18:00' },
      { day: 'wednesday', open: '09:00', close: '18:00' },
      { day: 'thursday', open: '09:00', close: '18:00' },
      { day: 'friday', open: '09:00', close: '18:00' },
      { day: 'saturday', open: '09:00', close: '15:00' }
      // Monday, Sunday closed
    ],
    status: 'active'
  }
];
```

### 7.3 Mock Employees

```typescript
export const MOCK_EMPLOYEES: Employee[] = [
  // Elegant Hair employees
  {
    _id: 'emp_001',
    name: 'John Stylist',
    businessId: 'biz_001',
    services: ['svc_001', 'svc_002', 'svc_003'],
    status: 'active'
  },
  {
    _id: 'emp_002',
    name: 'Jane Colorist',
    businessId: 'biz_001',
    services: ['svc_001', 'svc_004', 'svc_005'],
    status: 'active'
  },
  {
    _id: 'emp_003',
    name: 'Bob Allrounder',
    businessId: 'biz_001',
    services: ['svc_001', 'svc_002', 'svc_003', 'svc_004'],
    status: 'active',
    vacation: {
      start: '2026-02-10',
      end: '2026-02-17'
    }
  },
  // Downtown Barbers - single employee (auto-skip)
  {
    _id: 'emp_004',
    name: 'Mike Classic',
    businessId: 'biz_002',
    services: ['svc_006'],
    status: 'active'
  }
];
```

### 7.4 Mock Services

```typescript
export const MOCK_SERVICES: Service[] = [
  // Elegant Hair services
  {
    _id: 'svc_001',
    name: 'Подстригване',
    price: 25,
    priceFormatted: '25.00 лв.',
    currency: 'BGN',
    timeSlots: 2, // 30 min
    durationMinutes: 30,
    businessId: 'biz_001',
    status: 'active',
    icon: '✂️'
  },
  {
    _id: 'svc_002',
    name: 'Подстригване + Брада',
    price: 35,
    priceFormatted: '35.00 лв.',
    currency: 'BGN',
    timeSlots: 3, // 45 min
    durationMinutes: 45,
    businessId: 'biz_001',
    status: 'active',
    icon: '💈'
  },
  {
    _id: 'svc_003',
    name: 'Детско подстригване',
    price: 15,
    priceFormatted: '15.00 лв.',
    currency: 'BGN',
    timeSlots: 2,
    durationMinutes: 30,
    businessId: 'biz_001',
    status: 'active',
    icon: '👦'
  },
  {
    _id: 'svc_004',
    name: 'Боядисване',
    price: 60,
    priceFormatted: '60.00 лв.',
    currency: 'BGN',
    timeSlots: 6, // 90 min
    durationMinutes: 90,
    businessId: 'biz_001',
    status: 'active',
    icon: '🎨'
  },
  {
    _id: 'svc_005',
    name: 'Кичури',
    price: 80,
    priceFormatted: '80.00 лв.',
    currency: 'BGN',
    timeSlots: 8, // 120 min
    durationMinutes: 120,
    businessId: 'biz_001',
    status: 'active',
    icon: '✨'
  },
  // Downtown Barbers - single service (auto-skip)
  {
    _id: 'svc_006',
    name: 'Classic Haircut',
    price: 20,
    priceFormatted: '20.00 лв.',
    currency: 'BGN',
    timeSlots: 2,
    durationMinutes: 40, // 20 min slots
    businessId: 'biz_002',
    status: 'active',
    icon: '💇'
  }
];
```

### 7.5 Mock Appointments

```typescript
export const MOCK_APPOINTMENTS: Appointment[] = [
  // Upcoming
  {
    _id: 'apt_001',
    calendarId: 'cal_001',
    locationId: 'loc_001',
    employeeId: 'emp_001',
    serviceId: 'svc_001',
    start: '2026-02-14T10:00:00Z',
    end: '2026-02-14T10:30:00Z',
    customer: {
      name: 'Иван Иванов',
      phone: '+359 888 123 456',
      email: 'ivan@email.com'
    },
    status: 'confirmed',
    createdAt: '2026-02-10T15:30:00Z',
    createdBy: 'customer'
  },
  {
    _id: 'apt_002',
    calendarId: 'cal_001',
    locationId: 'loc_001',
    employeeId: 'emp_002',
    serviceId: 'svc_004',
    start: '2026-02-14T10:30:00Z',
    end: '2026-02-14T12:00:00Z',
    customer: {
      name: 'Мария Петрова',
      phone: '+359 888 456 789',
      email: 'maria@email.com'
    },
    status: 'confirmed',
    createdAt: '2026-02-11T09:00:00Z',
    createdBy: 'admin'
  },
  // Past
  {
    _id: 'apt_003',
    calendarId: 'cal_001',
    locationId: 'loc_001',
    employeeId: 'emp_001',
    serviceId: 'svc_002',
    start: '2026-01-20T14:00:00Z',
    end: '2026-01-20T14:45:00Z',
    customer: {
      name: 'Иван Иванов',
      phone: '+359 888 123 456',
      email: 'ivan@email.com'
    },
    status: 'completed',
    createdAt: '2026-01-15T10:00:00Z',
    createdBy: 'customer'
  }
];
```

### 7.6 Edge Case Scenarios

| Scenario | Mock Setup |
|----------|------------|
| No slots available | Employee `emp_003` (Bob) is on vacation Feb 10-17 |
| Long service on short day | `svc_005` (120 min) won't fit on Saturday at loc_001 (4 hours only) |
| Single location business | `biz_002` has only 1 location → auto-skip |
| Single employee | `loc_003` has only 1 employee → auto-skip |
| Single service | `emp_004` offers only 1 service → auto-skip |
| Closed day | Sunday closed at `loc_001`, Monday closed at `loc_003` |

---

## 8. Localization

### 8.1 Language Setup

- Default: Bulgarian (bg)
- Supported: Bulgarian (bg), English (en)
- Storage: AsyncStorage key `@language`
- Change: instant reload without app restart

### 8.2 Translation Keys Structure

```json
// i18n/bg.json
{
  "common": {
    "next": "Напред",
    "back": "Назад",
    "cancel": "Отказ",
    "confirm": "Потвърди",
    "save": "Запази",
    "delete": "Изтрий",
    "edit": "Редактирай",
    "search": "Търсене...",
    "loading": "Зареждане...",
    "error": "Грешка",
    "success": "Успех",
    "required": "Задължително поле"
  },
  "auth": {
    "entry": {
      "title": "GoBarber",
      "subtitle": "Вашият партньор за резервации",
      "codePlaceholder": "Въведете код на бизнес",
      "submit": "Продължи",
      "iAmBusiness": "Аз съм бизнес",
      "invalidCode": "Невалиден код на бизнес"
    },
    "admin": {
      "title": "Вход за администратор",
      "password": "Парола",
      "login": "Вход",
      "invalidCredentials": "Невалидни данни за вход"
    }
  },
  "booking": {
    "title": "Резервация",
    "step": "Стъпка {{current}}/{{total}}",
    "location": {
      "title": "Изберете локация",
      "lastSelected": "Последно избрано"
    },
    "employee": {
      "title": "Изберете специалист",
      "anyone": "Който е свободен",
      "anyoneDescription": "Ще ви свържем с първия свободен специалист"
    },
    "service": {
      "title": "Изберете услуга",
      "duration": "{{minutes}} мин"
    },
    "datetime": {
      "title": "Изберете дата и час",
      "availableSlots": "Свободни часове за {{date}}:",
      "noSlots": "Няма свободни часове за избрания период"
    },
    "personalData": {
      "title": "Вашите данни",
      "name": "Име",
      "phone": "Телефон",
      "email": "Имейл",
      "namePlaceholder": "Иван Иванов",
      "phonePlaceholder": "+359 888 123 456",
      "emailPlaceholder": "ivan@email.com"
    },
    "confirmation": {
      "title": "Потвърдете резервацията",
      "privacyPolicy": "Съгласен съм с Политика за поверителност",
      "submit": "Потвърди резервация"
    },
    "success": {
      "title": "Успешна резервация!",
      "emailSent": "Ще получите потвърждение на:",
      "addToCalendar": "Добави в календар",
      "goHome": "Към началото"
    }
  },
  "appointments": {
    "title": "Резервации",
    "upcoming": "Предстоящи",
    "past": "Минали",
    "empty": "Все още нямате резервации. Нека да поправим това! 💇",
    "bookAgain": "Запази отново",
    "cancel": "Откажи резервация",
    "cancelled": "Отказана",
    "completed": "Завършена",
    "detail": {
      "title": "Детайли на резервация"
    }
  },
  "settings": {
    "title": "Настройки",
    "language": "Език / Language",
    "notifications": "Известия",
    "pushNotifications": "Push известия",
    "reminder": "Напомняне преди час",
    "leaveBusiness": "Напусни бизнес",
    "leaveConfirmTitle": "Сигурни ли сте?",
    "leaveConfirmMessage": "Ще загубите запазените предпочитания за този бизнес.",
    "logout": "Изход",
    "version": "Версия"
  },
  "admin": {
    "dashboard": {
      "title": "Табло",
      "today": "Днес",
      "bookingsToday": "Резервации днес",
      "availableSlots": "Свободни слота",
      "expectedRevenue": "Очаквани приходи",
      "cancelledToday": "Отказани днес",
      "upcomingBookings": "Следващи резервации",
      "quickActions": "Бързи действия",
      "blockTime": "Блокирай време",
      "addBreak": "Добави почивка"
    },
    "calendar": {
      "title": "Календар",
      "day": "Ден",
      "week": "Седмица",
      "month": "Месец",
      "allEmployees": "Всички"
    },
    "appointments": {
      "title": "Резервации",
      "today": "Днес",
      "create": "Добави резервация",
      "call": "Обади се",
      "customer": "Клиент"
    },
    "settings": {
      "title": "Настройки",
      "businessInfo": "Информация за бизнеса",
      "workingHours": "Работно време",
      "employees": "Служители",
      "branding": "Брандиране"
    },
    "branding": {
      "title": "Брандиране",
      "logo": "Лого",
      "changeLogo": "Смени лого",
      "primaryColor": "Основен цвят",
      "preview": "Преглед"
    }
  },
  "errors": {
    "networkError": "Проблем с връзката. Проверете интернета.",
    "unknownError": "Опа! Нещо се обърка. Опитайте отново.",
    "validationError": "Моля, проверете въведените данни."
  }
}
```

---

## 9. Theming & Branding

### 9.1 Base Theme

```typescript
// theme/colors.ts
export const baseColors = {
  // Neutrals
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
  
  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
};

// Default primary (overridden by business branding)
export const defaultPrimary = '#00ACC2';
```

### 9.2 Dynamic Theme Provider

```typescript
// theme/ThemeProvider.tsx
interface ThemeContextValue {
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    ...baseColors
  };
  updatePrimaryColor: (color: string) => void;
}
```

### 9.3 Brand Color Application

Primary color from `business.branding.primaryColor` applies to:
- Progress bar fill
- Selected state borders and backgrounds
- Primary buttons
- Tab bar active icons
- Calendar selected date
- Links and interactive text
- Loading spinners

---

## 10. Offline-First Strategy

### 10.1 Data Caching Layers

| Data | Storage | TTL | Sync Strategy |
|------|---------|-----|---------------|
| Business info | MMKV | 24h | Refresh on app foreground |
| Locations | MMKV | 24h | With business |
| Employees | MMKV | 24h | With business |
| Services | MMKV | 24h | With business |
| Available slots | Memory | 5min | Fetch fresh on screen |
| Appointments | MMKV | 1h | Refresh on tab focus |
| User preferences | MMKV | Forever | Local only |
| Pending bookings | MMKV | Until sync | Queue for retry |

### 10.2 Offline Queue

```typescript
interface PendingAction {
  id: string;
  type: 'CREATE_BOOKING' | 'CANCEL_BOOKING';
  payload: any;
  createdAt: string;
  retryCount: number;
}
```

When offline:
1. Store action in queue
2. Show optimistic UI update
3. Display "Pending sync" indicator
4. On reconnect: process queue in order
5. Handle conflicts with server response

### 10.3 Network Status

```typescript
// hooks/useNetworkStatus.ts
- Uses @react-native-community/netinfo
- Exposes: isConnected, isInternetReachable
- Shows banner when offline
- Triggers sync when back online
```

---

## 11. Edge Cases & Error Handling

### 11.1 Error States

| Error | User Message (BG) | Recovery Action |
|-------|-------------------|-----------------|
| Network error | "Проблем с връзката. Проверете интернета." | Retry button |
| Invalid business code | "Невалиден код на бизнес" | Clear input, focus |
| No available slots | "Няма свободни часове за избрания период" | Suggest different date |
| Booking failed | "Опа! Нещо се обърка. Опитайте отново." | Retry from confirmation |
| Session expired (admin) | "Сесията ви изтече. Моля, влезте отново." | Navigate to login |

### 11.2 Empty States

| Screen | Message |
|--------|---------|
| No appointments | "Все още нямате резервации. Нека да поправим това! 💇" |
| No past appointments | "Все още нямате минали резервации." |
| No search results | "Няма намерени резултати за '{{query}}'" |
| No available employees | "Няма налични специалисти за момента." |

### 11.3 Validation Rules

| Field | Rules | Error Message |
|-------|-------|---------------|
| Name | Required, 2+ chars | "Името е задължително" |
| Phone | Required, valid format | "Телефонът е задължителен" |
| Email | Required, valid email | "Невалиден имейл" |
| Business code | Required, alphanumeric | "Въведете код" |
| Admin password | Required | "Въведете парола" |

---

## 12. Implementation Phases

### Phase 1: Foundation (Core Setup)
- [ ] Initialize Expo project with TypeScript
- [ ] Set up Expo Router navigation structure
- [ ] Configure Zustand stores
- [ ] Implement base UI components
- [ ] Set up i18n with BG/EN
- [ ] Create mock data files
- [ ] Implement theme provider with dynamic colors

### Phase 2: Authentication Flow
- [ ] GoBarber entry screen
- [ ] Admin login screen
- [ ] Auth store with persistence
- [ ] Role-based navigation routing

### Phase 3: Customer Booking Flow
- [ ] Location selection screen
- [ ] Employee selection screen (with "Anyone")
- [ ] Service selection screen
- [ ] Date/time selection screen
- [ ] Personal data form screen
- [ ] Confirmation screen
- [ ] Success screen with confetti
- [ ] Step-skipping logic
- [ ] Last-selected memory

### Phase 4: Customer Appointments & Settings
- [ ] Appointments list with tabs
- [ ] Appointment detail screen
- [ ] "Book Again" functionality
- [ ] Add to device calendar
- [ ] Settings screen
- [ ] Language switcher
- [ ] Leave business flow

### Phase 5: Admin Dashboard & Calendar
- [ ] Dashboard with stats
- [ ] Calendar view (day/week/month)
- [ ] Quick booking from calendar tap
- [ ] Block time functionality

### Phase 6: Admin Appointments & Settings
- [ ] Appointments list with search/filter
- [ ] Create appointment form
- [ ] Edit/cancel appointments
- [ ] Settings navigation
- [ ] Branding editor
- [ ] Working hours editor
- [ ] Employees management

### Phase 7: Polish & Edge Cases
- [ ] Offline indicators
- [ ] Error handling throughout
- [ ] Empty states
- [ ] Loading skeletons
- [ ] Animations and micro-interactions
- [ ] Accessibility review
- [ ] Performance optimization

---

## Appendix A: API Extensions Required

For production, the `api-new` needs these additions:

### Business Model Extension

```javascript
// models/Business.js - add to schema
branding: {
  primaryColor: { type: String, default: '#00ACC2' },
  logo: { type: String }
}
```

### New Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/business/code/:code` | Lookup business by URLpostfix |
| `POST` | `/business/:id/branding` | Update branding (admin) |
| `GET` | `/appointments/customer/:email` | Get customer's appointments |
| `POST` | `/appointments` | Create appointment (admin) |
| `PUT` | `/appointments/:id` | Update appointment (admin) |
| `DELETE` | `/appointments/:id` | Cancel appointment |

---

## Appendix B: File Cleanup Notes

All mock data is consolidated in `services/mock/mockData.ts`. For production:

1. Delete entire `services/mock/` folder
2. Update API client to use real endpoints
3. Remove mock delays
4. Update environment config

---

**Document End**

*Generated by BMad Master Party Mode Session - 2026-02-04*

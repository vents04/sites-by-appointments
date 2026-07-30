# AppointX Mobile App — Tech Stack

**Document type:** Technical Specification  
**Status:** Draft  
**Date:** 2026-02-24

---

## 1. Framework & Runtime

| Choice | Value | Rationale |
|--------|-------|------------|
| **Framework** | React Native | Cross-platform iOS + Android from single codebase. Same language (TypeScript) as backend. |
| **Meta-framework** | Expo | Fast iteration, managed build, built-in modules for push, deep links, localization. |
| **Routing** | Expo Router | File-based routing, native navigation, layout groups for (customer) vs (admin). |
| **Runtime** | Node.js / Hermes | Hermes is default in Expo for smaller bundles and faster startup. |

### ADR: React Native + Expo vs Flutter

| Factor | React Native + Expo | Flutter |
|--------|---------------------|---------|
| Language alignment | TypeScript — matches backend | Dart — additional language |
| API integration | Shared types possible with backend | Separate type definitions |
| Push / deep links | Expo modules (expo-notifications, expo-linking) | Plugin ecosystem |
| White-label theming | React context + style props | ThemeData |
| Team familiarity | Assumed TypeScript/React experience | Requires Dart learning |

**Decision:** React Native + Expo. Aligns with hosting spec (TypeScript backend), reduces context switching, and Expo handles mobile plumbing (push, deep links, OTA updates). This choice is derived from PRD and hosting requirements only — not from any existing `api/`, `api-new/`, or `web/` implementation.

---

## 2. State & Data

| Concern | Choice | Purpose |
|---------|--------|---------|
| **Client state** | Zustand | Lightweight, no boilerplate. Stores booking wizard state, selected business, UI preferences. |
| **Form state** | React Hook Form + Zod | Validation, minimal re-renders. Used for booking forms, settings. |
| **Local persistence** | AsyncStorage | Client info, saved business codes, appointments, cached business config, cached calendar/appointments. Offline-first: cache all fetchable data for offline use. |
| **API client** | Axios | HTTP client for REST API. Base URL from env, interceptors for auth headers. |

---

## 3. Authentication

| Mode | Method | Implementation |
|------|--------|----------------|
| **Client Mode** | None | Anonymous. Client data (name, phone, email) stored locally. |
| **Business Mode** | Shared business password | `X-Business-Password` header on staff routes. Password validated by API. Store in SecureStore after successful validation. |

**Note:** Cognito is used only for web admin portal. Mobile Business Mode does not use Cognito.

---

## 4. Push Notifications

| Component | Choice | Purpose |
|-----------|--------|---------|
| **Provider** | SNS Mobile Push (APNs + FCM) | Hosting spec ADR-11. Backend manages SNS platform endpoints. |
| **Client SDK** | expo-notifications | Registers device token, handles foreground/background. |
| **Registration** | `POST /api/public/push-token` | Body: `{ deviceToken, platform, bizId, clientPhone }`. |

---

## 5. Internationalization

| Choice | Purpose |
|--------|---------|
| **i18next + react-i18next** | String management, pluralization. |
| **expo-localization** | Device locale detection. |
| **Locales** | Bulgarian (bg), English (en). |

---

## 6. UI & Styling

| Concern | Choice | Purpose |
|---------|--------|---------|
| **Styling** | StyleSheet (React Native) | No additional CSS-in-JS. Theme via React context. |
| **Animations** | react-native-reanimated | Smooth transitions, gesture-driven UI. |
| **Icons** | @expo/vector-icons | Material, Ionicons, etc. |
| **Calendar** | react-native-calendars | Day/week views for Business Mode. |

---

## 7. Build & Deployment

| Environment | Configuration |
|-------------|---------------|
| **API base URL** | From env (e.g. `EXPO_PUBLIC_API_URL`). Points to CloudFront/API Gateway. |
| **Dev** | `appointx-dev-*` resources. |
| **Prod** | `appointx-prod-*` resources. |
| **Distribution** | EAS Build for iOS (App Store) and Android (Google Play). |

---

## 8. Recommended Dependencies

Suggested packages for implementation (not derived from any existing codebase):

| Package | Purpose |
|---------|---------|
| expo, expo-router | Framework, routing |
| react-native, react | Core |
| @react-native-async-storage/async-storage | Local persistence (PRD: client data on-device) |
| axios | API client |
| zustand | State management |
| react-hook-form, @hookform/resolvers, zod | Forms, validation |
| i18next, react-i18next | i18n |
| date-fns | Date handling |
| react-native-calendars | Calendar views (Business Mode) |
| react-native-reanimated, react-native-gesture-handler | Animations |
| expo-linking | Deep links |
| expo-localization | Locale detection |
| expo-notifications | Push registration |
| expo-secure-store | Business Mode password storage |

---

## 9. Optional Additions

| Package | Purpose |
|---------|---------|
| expo-updates | OTA updates for non-native changes. |

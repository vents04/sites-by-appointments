# AppointX Mobile App — Design System

**Document type:** Technical Specification  
**Status:** Draft  
**Date:** 2026-02-24  
**PRD reference:** White-label concept from `docs/client/appointx-general.md`, business config from hosting spec

---

## 1. Visual Style

| Principle | Spec |
|-----------|------|
| **Overall** | Minimalist and sleek |
| **Depth** | Flat design with subtle depth — soft shadows, light blur where appropriate |
| **Whitespace** | Generous whitespace; avoid clutter |
| **Layout** | Grid-based layout |
| **Motion** | Smooth micro-interactions (e.g. button press, list item tap, tab switch) |
| **Typography** | High contrast typography for readability |

**Theming:** Primary and secondary colors come from business config (`branding.primaryColor`, `branding.secondaryColor`). Apply to headers, buttons, links, active states, accents. See Section 3.

---

## 2. Typography

| Principle | Spec |
|-----------|------|
| **Font family** | Sans-serif, neo-grotesk style. Must support Bulgarian Cyrillic and Latin (English). Choose a font with full character coverage for both alphabets. |
| **Hierarchy** | Bold headlines, lighter body text. Clear visual hierarchy. |
| **Readability** | Readable UI text at all sizes. |

| Role | Spec | Use |
|------|------|-----|
| Heading 1 | 24–28px, bold | Screen titles |
| Heading 2 | 20–22px, semibold | Section titles |
| Body | 16px, regular | Main content |
| Caption | 14px, regular | Labels, hints |
| Button | 16px, semibold | CTA text |

Minimum touch target: 44×44pt (iOS HIG, Android Material).

---

## 3. White-Label (Business Config)

Branding comes from `GET /api/public/business/{bizId}/config`:

| Field | Purpose |
|-------|---------|
| `branding.logo` | Business logo URL (CloudFront `/assets/*`) |
| `branding.primaryColor` | Primary brand color — buttons, active tab, accents |
| `branding.secondaryColor` | Optional secondary color |

Apply theming consistently across the app while preserving the minimalist, flat-with-depth visual style.

---

## 4. Spacing & Layout

| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | Tight gaps |
| sm | 8px | Inline spacing |
| md | 16px | Section padding |
| lg | 24px | Screen padding |
| xl | 32px | Large gaps |

Use a grid-based layout. Generous whitespace between sections.

---

## 5. Colors

| Role | Source | Fallback |
|------|--------|----------|
| Primary | `branding.primaryColor` | `#1A1A1A` |
| Primary text on primary | White | — |
| Background | Light/dark theme | `#FFFFFF` / `#0A0A0A` |
| Surface | Slightly off background | `#F5F5F5` / `#141414` |
| Text | High contrast | `#212121` / `#FAFAFA` |
| Text secondary | Muted | `#757575` / `#B0B0B0` |
| Success | Semantic | Green |
| Error | Semantic | Red |
| Warning | Semantic | Orange |

---

## 6. Components

| Principle | Spec |
|-----------|------|
| **Corners** | Rounded corners — medium radius (e.g. 8–12px), not bubbly |
| **Interactions** | Subtle hover/press effects |
| **Icons** | Clean iconography — outline style preferred |
| **Structure** | Card-based UI sections |
| **Elevation** | Soft elevation layers (subtle shadows for depth) |

| Component | Spec |
|-----------|------|
| **Button primary** | Primary color (from config), white text, medium radius, soft shadow, subtle press effect |
| **Button secondary** | Outline or secondary color, medium radius, subtle hover/press |
| **Input** | Medium radius, border, placeholder, error state |
| **Card** | Surface bg, soft elevation, medium radius, card-based sections |
| **List item** | Tappable, chevron (outline icon), subtle press feedback |
| **Tab bar** | Outline icons, primary color for active state |
| **Avatar** | Circular, fallback initial or placeholder |

---

## 7. Layouts

| Screen type | Layout |
|-------------|--------|
| Code entry | Centered form, full-width input, primary CTA, generous whitespace |
| Wizard steps | Full-screen steps, progress indicator, back/next, grid-based |
| List screens | Scrollable list, card-based sections, pull-to-refresh |
| Detail screens | Header, content area, action buttons |
| Tab screens | Tab bar at bottom, content above |

---

## 8. Offline Banner (Persistent UI Element)

**Requirement:** When the user is offline and the app is showing cached or local data, a **persistent UI element** must always be visible to identify this state. The user must never be unsure whether they are viewing live or cached data.

| Attribute | Spec |
|-----------|------|
| **Placement** | Top of screen (below status bar) or as a fixed banner that stays visible while scrolling |
| **Visibility** | Shown whenever: (a) device is offline, and (b) the current screen displays cached/local data |
| **Content** | Clear text: e.g. "Offline" or "Viewing cached data" or "No connection — some features unavailable" |
| **Dismissal** | Not dismissible — it remains until connectivity is restored |
| **Style** | Distinct from primary content (e.g. warning/info color, subtle background). Does not obstruct main content but is always noticeable. |
| **Accessibility** | Announced to screen readers. Role: status or alert. |

**When to show:**
- Client Mode: My appointments (cached), Info (cached config), Settings (cached businesses), Book tab if config is cached but availability/submit need online
- Business Mode: Calendar (cached), Appointments list (cached), Appointment detail (cached)

**When not needed:**
- Fully offline-capable screens with no cached/server data (e.g. code entry when no business saved)
- User is online

---

## 9. Responsive & Accessibility

| Concern | Requirement |
|---------|--------------|
| Safe areas | Respect notch, home indicator |
| Keyboard | Dismiss on scroll, avoid overlap |
| Contrast | WCAG AA minimum |
| Labels | Accessible labels for interactive elements |

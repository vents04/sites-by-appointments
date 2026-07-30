# AppointX Mobile App — Technical Specification Overview

**Document type:** Technical Specification Reference  
**Status:** Draft  
**Date:** 2026-02-24  
**Location:** `docs/internal/mobile-app/`

---

## 1. Purpose & Scope

This folder contains the **technical specification for the AppointX mobile application**. It defines design decisions, desired design and layouts, technologies used, and implementation guidance for the iOS and Android app.

**Source documents:** The three approved PRDs and the hosting spec are the **only** upstream requirements. This spec is derived solely from these documents:

| Document | Path | Purpose |
|----------|------|---------|
| General Platform Overview | `docs/client/appointx-general.md` | User types, roles, shared concepts |
| Mobile Application PRD | `docs/client/appointx-mobile.md` | Client Mode flows, Business Mode flows, UI specs |
| Web Application PRD | `docs/client/appointx-web.md` | Context for web booking page |
| Hosting & Infrastructure Spec | `docs/internal/appointx-hosting.md` | API routes, auth, push, DynamoDB schema |

**Not used as reference:** `api/`, `api-new/`, `web/`, or any prior mobile implementation.

---

## 2. Document Structure

The mobile spec is split into focused documents for maintainability:

| Document | Purpose |
|----------|---------|
| [00-overview.md](./00-overview.md) | This document — scope, structure, links |
| [01-tech-stack.md](./01-tech-stack.md) | Framework, libraries, build, deployment |
| [02-architecture.md](./02-architecture.md) | Modules, data flow, API integration |
| [03-client-mode.md](./03-client-mode.md) | Client Mode screens, flows, API mapping |
| [04-business-mode.md](./04-business-mode.md) | Business Mode screens, flows, API mapping |
| [05-design-system.md](./05-design-system.md) | White-label, typography, components, layouts |
| [06-edge-cases.md](./06-edge-cases.md) | Offline, deep links, multi-business, errors |
| [07-acceptance-criteria.md](./07-acceptance-criteria.md) | PRD flow → testable behaviors |
| [08-integration.md](./08-integration.md) | API shapes, error codes, push payloads |

---

## 3. App Modes Summary

| Mode | Users | Auth | Entry Point |
|------|-------|------|-------------|
| **Client Mode** | Clients (booking appointments) | None — anonymous | Business code entry or deep link |
| **Business Mode** | Staff, managers | Shared business password | Password entry after code |

---

## 4. Traceability

- **PRD → Screen:** Each screen in `03-client-mode.md` and `04-business-mode.md` references the PRD section.
- **Screen → API:** Each screen documents the API endpoints it calls.
- **API → Hosting:** Hosting spec Section 17 is the canonical API route map.

---

## 5. Implementation Status

The mobile app is to be built from scratch per this spec. No existing implementation (boilerplate or otherwise) is used as reference.

---

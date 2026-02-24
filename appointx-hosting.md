# ZapaziChas — AWS Infrastructure & Technical Specification

**Document type:** Authoritative Reference Architecture + Architectural Decision Record + Developer Handoff  
**Status:** Approved  
**Date:** 2026-02-24  
**Supersedes:** All prior infrastructure references including the Onboarding Guide's infrastructure sections

---

## Table of Contents

1. [Document Purpose & Scope](#1-document-purpose--scope)
2. [Platform Overview](#2-platform-overview)
3. [Architectural Decision Records](#3-architectural-decision-records)
4. [AWS Services Inventory](#4-aws-services-inventory)
5. [Network & Edge Layer](#5-network--edge-layer)
6. [Compute Layer](#6-compute-layer)
7. [Data Layer](#7-data-layer)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [Storage](#9-storage)
10. [Messaging](#10-messaging)
11. [Scheduling](#11-scheduling)
12. [Security](#12-security)
13. [Monitoring & Observability](#13-monitoring--observability)
14. [Environment Strategy](#14-environment-strategy)
15. [Infrastructure as Code (CDK)](#15-infrastructure-as-code-cdk)
16. [CI/CD Pipeline](#16-cicd-pipeline)
17. [API Route Map](#17-api-route-map)
18. [Cost Estimate](#18-cost-estimate)
19. [Repository Structure](#19-repository-structure)

---

## 1. Document Purpose & Scope

This document is the **single source of truth** for all AWS infrastructure decisions, service configurations, and technical specifications for the ZapaziChas platform. It serves three purposes:

1. **Reference Architecture** — defines every AWS service, its configuration, and how services interconnect
2. **Architectural Decision Record** — documents each technology choice with rationale
3. **Developer Handoff** — provides enough detail for a developer to implement the CDK stacks and Lambda code

**Source documents:** The three approved PRDs (General Platform Overview, Web Application PRD, Mobile Application PRD) are the only upstream requirements. All infrastructure decisions in this document are derived from those PRD requirements.

**What this document does NOT cover:** Application business logic, UI/UX design, mobile app implementation details, or API request/response schemas. Those belong in their respective tech specs, which will be derived from this infrastructure foundation.

---

## 2. Platform Overview

ZapaziChas is a white-label SaaS appointment booking platform for service-based businesses in Bulgaria. Each registered business gets a branded booking page and a unique code for the mobile app.

### Surfaces

| Surface | Entry Point | Users | Auth |
|---|---|---|---|
| Marketing landing page | `{domain}` | Public visitors | None |
| Business booking page | `{domain}/{slug}` | Clients booking appointments | None (anonymous) |
| Business admin portal | `{domain}` (post-login) | Business managers | Cognito email/password |
| Platform admin dashboard | `{domain}/admin` | Platform operators | Cognito email/password + MFA |
| Mobile app — Client Mode | iOS & Android | Clients (via business code) | None (anonymous) |
| Mobile app — Business Mode | iOS & Android | Staff (via shared business password) | Business password validated by API |

### User Types

| Role | Has Account? | Access Channel | Auth Method |
|---|---|---|---|
| **Client** | No — anonymous | Web booking page, Mobile Client Mode | None — data stored on-device |
| **Employee** | No — DB record only | Mobile Business Mode | Shared business password |
| **Manager** | Yes — Cognito account | Web admin portal + Mobile Business Mode | Email/password (Cognito) |
| **Platform Admin** | Yes — Cognito account | Web platform admin dashboard | Email/password + MFA (Cognito) |

### Core Domain Entities

```
Platform
  └── Business (code: "BELLA123", slug: "bella-beauty")
        ├── Branding (logo, colors)
        ├── Locations[]
        │     ├── Address, phone, email
        │     └── Working hours (per day of week)
        ├── Services[]
        │     ├── Name, description, duration, price
        │     ├── Category (optional grouping)
        │     ├── Assigned locations[]
        │     └── Assigned employees[]
        ├── Employees[]
        │     ├── Name, avatar
        │     ├── Assigned services[]
        │     ├── Assigned locations[]
        │     └── Working hours (per day, can vary by location)
        ├── Appointments[]
        │     ├── Client info (name, phone, email)
        │     ├── Service, Employee, Location
        │     ├── Date/time, Status (Confirmed → Completed | Cancelled | NoShow)
        │     ├── Booking source (web | mobile)
        │     └── Confirmation reference code
        ├── Blocked Time[]
        │     ├── Employee (or all), Location
        │     ├── Start/end datetime, Reason
        │     └── Recurrence pattern (optional)
        ├── Reminder Rules[]
        │     ├── Type: fixed-time (e.g. "09:00") | time-anchored (e.g. "2h before")
        │     └── Active toggle
        ├── Cancellation Policy
        │     ├── Allow client cancellations (yes/no)
        │     ├── Deadline (e.g. "24 hours before")
        │     └── Custom message
        ├── Managers[] (Cognito user references)
        └── Business Password (shared, for mobile Business Mode)

Registration Requests[]
  ├── Business info, contact person
  ├── Status (Pending | Approved | Rejected)
  └── Submitted via marketing page form
```

---

## 3. Architectural Decision Records

Every technology choice for this platform, with rationale.

| # | Decision | Choice | Rationale |
|---|---|---|---|
| ADR-01 | AWS Region | `eu-central-1` (Frankfurt) | Closest AWS region to Bulgaria (~15ms latency). Full service availability. GDPR-compliant EU data residency. |
| ADR-02 | Infrastructure as Code | AWS CDK (TypeScript) | Type-safe infrastructure definitions. Same language as Lambda code (TypeScript). Powerful L2 constructs reduce boilerplate. Generates CloudFormation under the hood. |
| ADR-03 | API Gateway | HTTP API v2 | 70% cheaper than REST API v1. Built-in JWT authorizer for Cognito. Sufficient feature set for this platform (no usage plans, API keys, or request validation needed at gateway level). |
| ADR-04 | Database | DynamoDB (on-demand, single-table) | $0 at idle. Sub-10ms reads. No connection pooling or management. Scales automatically. Single-table design groups all business data under one partition key for efficient queries. |
| ADR-05 | Lambda runtime | Node.js 22.x on ARM_64 | Node.js 22 is current LTS with long-term support. ARM architecture is 20% cheaper per ms and delivers faster cold starts than x86_64. |
| ADR-06 | Lambda strategy | Monolambda (API) + isolated Lambda (Reminders) | Monolambda: simpler deployment, shared warm instances, one permission set. Adequate at projected traffic. Separate reminder Lambda: isolates scheduled processing from API traffic; cannot be affected by API abuse or throttling. |
| ADR-07 | Lambda framework | Hono | 14KB bundle addition (negligible cold-start impact). Purpose-built for serverless/edge. Provides routing, middleware chain, CORS, error handling, typed requests. Avoids building a custom micro-framework for 40+ routes across 4 auth tiers. |
| ADR-08 | Frontend hosting | S3 + CloudFront with OAC | Standard serverless SPA hosting. S3 stores static files privately. CloudFront provides CDN, TLS, SPA routing (404→index.html fallback). Origin Access Control prevents direct S3 access. |
| ADR-09 | Authentication | Cognito User Pool | Free tier covers 50,000 MAU. Native JWT integration with HTTP API v2 authorizer. Built-in email verification, password policies, MFA. No need for a third-party auth provider. |
| ADR-10 | Email | Amazon SES | Pay-per-send ($0.10/1000 emails). Transactional email for confirmations, reminders, notifications. Template support. Domain verification with DKIM/SPF. |
| ADR-11 | Push notifications | SNS Mobile Push | Native APNs (iOS) and FCM (Android) integration. Platform endpoint management. Pay-per-notification ($0.50/million). |
| ADR-12 | Reminder scheduling | EventBridge Scheduler | One-time schedules created per reminder event. Auto-deletes after execution. No cron jobs to manage. Invokes the reminder Lambda directly. |
| ADR-13 | Edge security | WAF v2 on CloudFront (prod only) | Single WAF protects both static assets and API. Rate limiting, geo restriction, managed rule sets. Applied to prod distribution only to minimize cost during development. |
| ADR-14 | DDoS protection | Shield Standard | Automatic L3/L4 DDoS protection. Free. Included with all AWS accounts. No configuration needed. |
| ADR-15 | VPC | None | Every AWS service used (DynamoDB, SES, SNS, EventBridge, Cognito, S3) is accessed via public AWS endpoints with IAM authentication. A VPC would add NAT Gateway cost ($32+/month minimum) for zero security benefit in this serverless architecture. |
| ADR-16 | Geo restriction | EU member states + Bulgaria's neighbors | WAF geo-match rule. Allow: all 27 EU member states + Serbia, North Macedonia, Turkey. Block all other origins. Covers Bulgarian domestic users, EU diaspora, and neighboring countries. |
| ADR-17 | Budget | $25–50/month pre-launch | Lambda concurrency limits, API Gateway throttling, and budget alarms calibrated for this ceiling. Will be revised upward at production launch. |
| ADR-18 | Environments | dev + prod in single AWS account | Name-prefixed resources (`zapazichas-dev-*`, `zapazichas-prod-*`). Separate DynamoDB tables per environment. Separate CloudFront distributions. Single account simplifies management and avoids cross-account complexity at this stage. |
| ADR-19 | CloudFront distributions | 2 distributions (prod + dev) | Prod: custom domain, WAF attached, full caching. Dev: default CloudFront domain (`d1234.cloudfront.net`), no WAF, same caching/SPA behavior as prod for parity testing. |
| ADR-20 | Media uploads | S3 pre-signed URLs | Lambda generates time-limited upload URLs. Client uploads directly to S3. Avoids the 6MB Lambda payload limit. Keeps media traffic off the API. |

---

## 4. AWS Services Inventory

Complete list of AWS services used, organized by layer.

| Layer | Service | Purpose | Environment |
|---|---|---|---|
| DNS | Route 53 | Domain routing, health checks | Shared (one hosted zone) |
| Edge | CloudFront | CDN, TLS termination, SPA routing | Per-env distribution |
| Edge security | WAF v2 | Rate limiting, geo restriction, managed rules | Prod only |
| Edge security | Shield Standard | L3/L4 DDoS protection | Automatic |
| Frontend hosting | S3 (frontend bucket) | SPA static files | Per-env bucket |
| Media hosting | S3 (media bucket) | Business logos, employee avatars | Per-env bucket |
| API | API Gateway HTTP API v2 | Single API endpoint, JWT auth | Per-env API |
| Compute | Lambda (API function) | All business logic, Hono router | Per-env function |
| Compute | Lambda (Reminder function) | Processes scheduled reminders | Per-env function |
| Database | DynamoDB | Single-table design, all platform data | Per-env table |
| Auth | Cognito User Pool | Manager and platform admin authentication | Per-env pool |
| Email | SES | Booking confirmations, reminders, notifications | Shared (one verified domain) |
| Push | SNS Mobile Push | iOS (APNs) and Android (FCM) push notifications | Per-env platform apps |
| Scheduling | EventBridge Scheduler | One-time reminder schedules | Shared (per-env schedule group) |
| Monitoring | CloudWatch Logs | Lambda logs | Per-env log groups |
| Monitoring | CloudWatch Alarms | Error rate, throttle, latency alerts | Per-env alarms |
| Cost control | AWS Budgets | Monthly spend alerts | Shared |
| Cost control | Cost Anomaly Detection | ML-powered spend spike detection | Shared |
| Certificates | ACM | TLS certificates for CloudFront | `us-east-1` (CloudFront requirement) |
| Secrets | Systems Manager Parameter Store | Environment-specific configuration values | Per-env parameters |

---

## 5. Network & Edge Layer

### 5.1 DNS — Route 53

**Hosted zone:** One hosted zone for the production domain. Dev environment uses the default CloudFront domain and does not require DNS configuration.

**Records (prod):**

| Record | Type | Target |
|---|---|---|
| `{domain}` | A (Alias) | CloudFront distribution (prod) |
| `{domain}` | AAAA (Alias) | CloudFront distribution (prod) |
| SES verification records | CNAME × 3 | DKIM tokens from SES |
| SES SPF record | TXT | `v=spf1 include:amazonses.com ~all` |

**Cost:** $0.50/month per hosted zone + $0.40/million queries.

### 5.2 CDN — CloudFront

Two distributions with identical origin behavior but different security configurations.

#### Prod Distribution

| Setting | Value |
|---|---|
| Price class | PriceClass_100 (North America + Europe) |
| TLS | TLSv1.2_2021 minimum |
| HTTP version | HTTP/2 and HTTP/3 |
| Custom domain | `{domain}` |
| ACM certificate | Provisioned in `us-east-1` |
| WAF WebACL | Attached (see Section 12.2) |
| Default root object | `index.html` |
| Logging | Disabled (cost optimization; enable if needed) |

#### Dev Distribution

| Setting | Value |
|---|---|
| Price class | PriceClass_100 |
| TLS | TLSv1.2_2021 minimum |
| HTTP version | HTTP/2 |
| Custom domain | None (use default `d*.cloudfront.net`) |
| WAF WebACL | None |
| Default root object | `index.html` |

#### Origin Behaviors (both distributions)

| Priority | Path Pattern | Origin | Cache Policy | Auth | Allowed Methods |
|---|---|---|---|---|---|
| 1 | `/api/*` | API Gateway HTTP API | CachingDisabled | Pass-through to Lambda | All methods |
| 2 | `/assets/*` | S3 media bucket | CachingOptimized (30 days) | CloudFront OAC | GET, HEAD |
| 0 (default) | `/*` | S3 frontend bucket | CachingOptimized (1 day) | CloudFront OAC | GET, HEAD |

**SPA fallback:** Custom error responses return `/index.html` with HTTP 200 for both 404 and 403 errors. This enables client-side routing.

**API origin configuration:**

| Setting | Value |
|---|---|
| Origin domain | `{apiId}.execute-api.eu-central-1.amazonaws.com` |
| Origin protocol | HTTPS only |
| Origin request policy | AllViewerExceptHostHeader |
| Response headers policy | None (CORS handled by Lambda/Hono) |

### 5.3 Shield Standard

Automatic L3/L4 DDoS protection. No configuration required. Free with every AWS account. Protects CloudFront distributions, Route 53, and all public-facing endpoints.

---

## 6. Compute Layer

### 6.1 API Gateway — HTTP API v2

One HTTP API per environment. All client traffic (web, mobile) routes through CloudFront to this API.

| Setting | Value |
|---|---|
| API name | `zapazichas-{env}-api` |
| Protocol | HTTP |
| CORS | Handled by Hono in Lambda (not at API Gateway level) |
| Default stage | `$default` (auto-deploy) |
| Throttling — burst limit | 100 requests |
| Throttling — rate limit | 50 requests/second |

**Route configuration:**

| Route | Method | Integration | Authorizer |
|---|---|---|---|
| `/api/public/{proxy+}` | ANY | Lambda (API) | None |
| `/api/staff/{proxy+}` | ANY | Lambda (API) | None (business password validated in Lambda) |
| `/api/manager/{proxy+}` | ANY | Lambda (API) | Cognito JWT authorizer |
| `/api/admin/{proxy+}` | ANY | Lambda (API) | Cognito JWT authorizer (role checked in Lambda) |

**JWT Authorizer:**

| Setting | Value |
|---|---|
| Name | `CognitoAuth` |
| Identity source | `$request.header.Authorization` |
| Issuer | `https://cognito-idp.eu-central-1.amazonaws.com/{userPoolId}` |
| Audience | `[{userPoolClientId}]` |

### 6.2 Lambda — API Function

The monolambda that handles all API business logic, using Hono as the routing framework.

| Setting | Value |
|---|---|
| Function name | `zapazichas-{env}-api` |
| Runtime | `nodejs22.x` |
| Architecture | `arm64` |
| Handler | `index.handler` |
| Memory | 256 MB |
| Timeout | 10 seconds |
| Reserved concurrency | 25 (cost protection) |
| Ephemeral storage | 512 MB (default) |

**Environment variables:**

| Variable | Value |
|---|---|
| `TABLE_NAME` | `zapazichas-{env}-main` |
| `USER_POOL_ID` | Cognito User Pool ID |
| `MEDIA_BUCKET` | `zapazichas-{env}-media` |
| `SES_FROM_EMAIL` | `noreply@{domain}` |
| `SES_REGION` | `eu-central-1` |
| `SNS_ANDROID_PLATFORM_ARN` | SNS platform application ARN (Android) |
| `SNS_IOS_PLATFORM_ARN` | SNS platform application ARN (iOS) |
| `SCHEDULER_ROLE_ARN` | EventBridge Scheduler execution role ARN |
| `REMINDER_FUNCTION_ARN` | Reminder Lambda ARN |
| `SCHEDULER_GROUP_NAME` | `zapazichas-{env}-reminders` |
| `ENV` | `dev` or `prod` |

**IAM permissions** (see Section 12.1 for full policy).

### 6.3 Lambda — Reminder Function

Isolated function that processes scheduled reminders. Invoked by EventBridge Scheduler, not by API traffic.

| Setting | Value |
|---|---|
| Function name | `zapazichas-{env}-reminder` |
| Runtime | `nodejs22.x` |
| Architecture | `arm64` |
| Handler | `index.handler` |
| Memory | 256 MB |
| Timeout | 10 seconds |
| Reserved concurrency | 5 (cost protection) |

**Environment variables:**

| Variable | Value |
|---|---|
| `TABLE_NAME` | `zapazichas-{env}-main` |
| `SES_FROM_EMAIL` | `noreply@{domain}` |
| `SES_REGION` | `eu-central-1` |
| `SNS_ANDROID_PLATFORM_ARN` | SNS platform application ARN (Android) |
| `SNS_IOS_PLATFORM_ARN` | SNS platform application ARN (iOS) |
| `ENV` | `dev` or `prod` |

**IAM permissions:** Read-only DynamoDB access + SES send + SNS publish (see Section 12.1).

### 6.4 Request Flow

```
Client (browser / mobile app)
  → CloudFront (edge cache check)
    → [STATIC] S3 frontend bucket (SPA files) ← OAC
    → [MEDIA]  S3 media bucket (logos, avatars) ← OAC
    → [API]    /api/* → API Gateway HTTP API
      → JWT Authorizer (Cognito, for manager/admin routes only)
      → Lambda API function (Hono router)
        → DynamoDB (read/write data)
        → SES (send emails)
        → SNS (send push notifications)
        → EventBridge Scheduler (create/delete reminder schedules)
        → S3 (generate pre-signed upload URLs)

EventBridge Scheduler (fires at reminder time)
  → Lambda Reminder function
    → DynamoDB (read appointment + business data)
    → SES and/or SNS (deliver reminder)
```

---

## 7. Data Layer

### 7.1 DynamoDB Configuration

| Setting | Value |
|---|---|
| Table name | `zapazichas-{env}-main` |
| Billing mode | On-demand (PAY_PER_REQUEST) |
| Partition key | `PK` (String) |
| Sort key | `SK` (String) |
| Point-in-time recovery | Enabled |
| Deletion protection | Enabled (prod) / Disabled (dev) |
| Removal policy | RETAIN (prod) / DESTROY (dev) |
| Encryption | AWS-owned key (default, free) |
| Global secondary indexes | 2 (GSI1, GSI2) |

### 7.2 Index Definitions

| Index | Partition Key | Sort Key | Projection |
|---|---|---|---|
| **Primary** | `PK` (String) | `SK` (String) | — |
| **GSI1** | `GSI1PK` (String) | `GSI1SK` (String) | ALL |
| **GSI2** | `GSI2PK` (String) | `GSI2SK` (String) | ALL |

### 7.3 Entity Key Patterns

| Entity | PK | SK | GSI1PK | GSI1SK | GSI2PK | GSI2SK |
|---|---|---|---|---|---|---|
| Business (metadata) | `BIZ#{bizId}` | `#META` | `CODE#{code}` | `#META` | `SLUG#{slug}` | `#META` |
| Business branding | `BIZ#{bizId}` | `#BRAND` | — | — | — | — |
| Business password | `BIZ#{bizId}` | `#PASSWORD` | — | — | — | — |
| Cancellation policy | `BIZ#{bizId}` | `#CANCEL_POLICY` | — | — | — | — |
| Location | `BIZ#{bizId}` | `LOC#{locId}` | — | — | — | — |
| Service | `BIZ#{bizId}` | `SVC#{svcId}` | — | — | — | — |
| Employee | `BIZ#{bizId}` | `EMP#{empId}` | — | — | — | — |
| Employee schedule | `BIZ#{bizId}` | `EMP#{empId}#SCHED` | — | — | — | — |
| Appointment | `BIZ#{bizId}` | `APT#{aptId}` | `BIZ#{bizId}#DATE` | `{date}#{time}` | `BIZ#{bizId}#EMP#{empId}` | `{date}#{time}` |
| Blocked time | `BIZ#{bizId}` | `BLK#{blkId}` | `BIZ#{bizId}#EMP#{empId}` | `BLK#{date}#{time}` | — | — |
| Reminder rule | `BIZ#{bizId}` | `REM#{remId}` | — | — | — | — |
| Manager link | `BIZ#{bizId}` | `MGR#{email}` | `MGR#{email}` | `BIZ#{bizId}` | — | — |
| Registration request | `REG#{regId}` | `#META` | `REG#STATUS` | `{status}#{timestamp}` | — | — |
| Push token (mobile) | `PUSH#{deviceToken}` | `#META` | `BIZ#{bizId}#CLIENT` | `{clientPhone}` | — | — |
| Platform config | `PLATFORM` | `#CONFIG` | — | — | — | — |
| Platform admin | `PLATFORM` | `ADMIN#{email}` | — | — | — | — |

### 7.4 Access Pattern → Query Mapping

| Access Pattern | Operation | Key Condition |
|---|---|---|
| Get business by ID | Query primary | `PK = BIZ#{bizId}, SK = #META` |
| Get business by code (mobile app) | Query GSI1 | `GSI1PK = CODE#{code}` |
| Get business by slug (web page) | Query GSI2 | `GSI2PK = SLUG#{slug}` |
| Get all config for a business | Query primary | `PK = BIZ#{bizId}` (returns metadata, branding, password, policy, all locations, services, employees, schedules, reminder rules, managers) |
| Get all locations for a business | Query primary | `PK = BIZ#{bizId}, SK begins_with LOC#` |
| Get all services for a business | Query primary | `PK = BIZ#{bizId}, SK begins_with SVC#` |
| Get all employees for a business | Query primary | `PK = BIZ#{bizId}, SK begins_with EMP#` |
| Get employee with schedule | Query primary | `PK = BIZ#{bizId}, SK begins_with EMP#{empId}` (returns both employee record and schedule) |
| Get appointments for business on date | Query GSI1 | `GSI1PK = BIZ#{bizId}#DATE, GSI1SK begins_with {date}` |
| Get appointments for employee on date range | Query GSI2 | `GSI2PK = BIZ#{bizId}#EMP#{empId}, GSI2SK between {startDate} and {endDate}` |
| Get single appointment | Query primary | `PK = BIZ#{bizId}, SK = APT#{aptId}` |
| Get blocked time for employee | Query GSI1 | `GSI1PK = BIZ#{bizId}#EMP#{empId}, GSI1SK begins_with BLK#` |
| Get all reminder rules for business | Query primary | `PK = BIZ#{bizId}, SK begins_with REM#` |
| Get all businesses for a manager | Query GSI1 | `GSI1PK = MGR#{email}` |
| List pending registrations | Query GSI1 | `GSI1PK = REG#STATUS, GSI1SK begins_with Pending#` |
| List all registrations by status | Query GSI1 | `GSI1PK = REG#STATUS, GSI1SK begins_with {status}#` |
| Find push tokens for client at business | Query GSI1 | `GSI1PK = BIZ#{bizId}#CLIENT, GSI1SK = {clientPhone}` |
| Get platform config | GetItem | `PK = PLATFORM, SK = #CONFIG` |
| List platform admins | Query primary | `PK = PLATFORM, SK begins_with ADMIN#` |

### 7.5 Availability Check Algorithm

The booking wizard's availability check is the most complex query. Given a date, service, and location, it determines which time slots are open and which employees are available.

```
Input: bizId, serviceId, locationId, date

1. Fetch the service record:
   Query: PK = BIZ#{bizId}, SK = SVC#{serviceId}
   Extract: duration (minutes), assignedEmployeeIds[], assignedLocationIds[]

2. Verify the requested location is assigned to this service.

3. For each assigned employee (in parallel):
   a. Fetch employee record + schedule:
      Query: PK = BIZ#{bizId}, SK begins_with EMP#{empId}
      Extract: working hours for the requested day-of-week at the requested location

   b. Fetch existing appointments for this employee on the date:
      Query GSI2: GSI2PK = BIZ#{bizId}#EMP#{empId}, GSI2SK begins_with {date}

   c. Fetch blocked time for this employee covering the date:
      Query GSI1: GSI1PK = BIZ#{bizId}#EMP#{empId}, GSI1SK begins_with BLK#{date}

4. Compute free slots per employee:
   a. Start with employee's working hours for that day at that location
   b. Subtract all existing appointment time ranges
   c. Subtract all blocked time ranges
   d. Divide remaining contiguous time into slots matching the service duration
   e. Apply any buffer time between appointments if configured

5. Aggregate across employees:
   For each unique time slot, list which employees are available

6. Return only slots with >= 1 available employee.
   Include employee options per slot so the client can choose or accept auto-assignment.
```

All DynamoDB queries in steps 3a-3c execute in parallel using `Promise.all()`. Total latency is bounded by the slowest single query (~10-20ms), not the sum.

---

## 8. Authentication & Authorization

### 8.1 Cognito User Pool

| Setting | Value |
|---|---|
| Pool name | `zapazichas-{env}-users` |
| Self-signup | Disabled (managers created by platform admins or registration approval flow) |
| Sign-in aliases | Email only |
| Email verification | Required |
| Password policy — min length | 12 characters |
| Password policy — requirements | Uppercase + digits required; symbols optional |
| MFA | Optional (enforced for platform admins via custom attribute check) |
| MFA method | TOTP only (no SMS) |
| Account recovery | Email only |
| Advanced security | Disabled (cost optimization; enable at scale) |

**Custom attributes:**

| Attribute | Type | Mutable | Purpose |
|---|---|---|---|
| `custom:role` | String | Yes | `manager` or `platform_admin` |
| `custom:businessId` | String | Yes | Linked business ID (managers only) |

**User Pool Client:**

| Setting | Value |
|---|---|
| Client name | `zapazichas-{env}-web` |
| Auth flows | USER_SRP_AUTH |
| Generate client secret | No |
| Prevent user existence errors | Yes |
| Token validity — access token | 1 hour |
| Token validity — refresh token | 30 days |
| Token validity — ID token | 1 hour |

### 8.2 Auth Flow per User Type

**Clients (anonymous):**
No authentication. Public API routes require no tokens. Client data (name, phone, email) is stored on the device and sent with booking requests.

**Employees (business password):**
Staff routes require a `X-Business-Password` header. The API Lambda validates this password against the hashed business password stored in DynamoDB. This is not Cognito authentication — it's application-level shared-secret validation.

```
Mobile app → POST /api/staff/{bizId}/appointments
  Headers: { X-Business-Password: "salon2024" }
  → Lambda middleware: fetch BIZ#{bizId}#PASSWORD from DynamoDB
  → Compare bcrypt hash
  → Allow or reject (401)
```

**Managers (Cognito JWT):**
Manager routes are protected by the API Gateway JWT authorizer. The JWT `custom:role` claim must equal `manager`, and the `custom:businessId` must match the `{bizId}` in the request path. Checked in Lambda middleware.

**Platform admins (Cognito JWT + MFA):**
Admin routes are protected by the same JWT authorizer. The JWT `custom:role` claim must equal `platform_admin`. MFA is enforced for platform admin accounts (set during account creation). Platform admins can access any business.

### 8.3 JWT Claims Used in Authorization

```json
{
  "sub": "cognito-user-id",
  "email": "manager@example.com",
  "custom:role": "manager",
  "custom:businessId": "biz_001",
  "aud": "{userPoolClientId}",
  "iss": "https://cognito-idp.eu-central-1.amazonaws.com/{userPoolId}"
}
```

**Authorization matrix enforced in Lambda:**

| Route prefix | Required role | Business scope check |
|---|---|---|
| `/api/public/*` | None | None |
| `/api/staff/*` | None (password check) | Password must match `{bizId}` |
| `/api/manager/*` | `manager` | JWT `custom:businessId` must equal `{bizId}` |
| `/api/admin/*` | `platform_admin` | Full access to all businesses |

---

## 9. Storage

### 9.1 S3 — Frontend Bucket

Hosts the SPA static files (HTML, CSS, JS, images bundled with the app).

| Setting | Value |
|---|---|
| Bucket name | `zapazichas-{env}-frontend` |
| Public access | Block all |
| Access | CloudFront OAC only |
| Encryption | S3-managed (SSE-S3) |
| Versioning | Disabled (deployments overwrite via sync) |
| Lifecycle rules | None |
| Removal policy | RETAIN (prod) / DESTROY (dev) |

### 9.2 S3 — Media Bucket

Hosts user-uploaded content: business logos, employee avatars.

| Setting | Value |
|---|---|
| Bucket name | `zapazichas-{env}-media` |
| Public access | Block all |
| Access | CloudFront OAC (reads) + pre-signed URLs (writes) |
| Encryption | S3-managed (SSE-S3) |
| Versioning | Disabled |
| Lifecycle rules | None (media is persistent) |
| CORS | Allowed origins: `{domain}` (prod) or `*` (dev). Methods: PUT. Headers: Content-Type. |
| Max file size | Enforced in pre-signed URL policy: 5 MB |
| Allowed content types | `image/jpeg`, `image/png`, `image/webp` |

### 9.3 Pre-Signed URL Upload Flow

```
1. Manager → POST /api/manager/{bizId}/logo
   (or POST /api/manager/{bizId}/employees/{empId}/avatar)

2. Lambda validates request, generates S3 pre-signed PUT URL:
   - Bucket: zapazichas-{env}-media
   - Key: {bizId}/logo/{uuid}.{ext}  (or {bizId}/avatars/{empId}/{uuid}.{ext})
   - Expiry: 5 minutes
   - Conditions: content-type must be image/*, content-length <= 5MB

3. Lambda returns pre-signed URL + final asset URL to client.

4. Client uploads directly to S3 using the pre-signed URL (PUT request).

5. Client sends the final asset URL back to the API to update the business/employee record.
```

Media is served via CloudFront at `/assets/*` with 30-day cache and immutable headers.

**Media key structure in S3:**

```
{bizId}/logo/{uuid}.{ext}
{bizId}/avatars/{empId}/{uuid}.{ext}
```

---

## 10. Messaging

### 10.1 SES — Email

**Setup requirements:**

1. **Domain verification:** Verify the sending domain via DNS (DKIM + SPF records in Route 53)
2. **Production access:** Request production sending access (SES starts in sandbox mode, which only allows sending to verified email addresses)
3. **Configuration set:** Create `zapazichas-main` configuration set for delivery tracking

| Setting | Value |
|---|---|
| Verified domain | `{domain}` |
| From address | `noreply@{domain}` |
| Region | `eu-central-1` |
| Sending limit (initial) | Request 1,000 emails/day |
| Configuration set | `zapazichas-main` |

**Email types (derived from PRDs):**

| Email | Trigger | Recipients |
|---|---|---|
| Booking confirmation | Appointment created | Client email |
| Appointment reminder | EventBridge schedule fires | Client email |
| Cancellation notice | Appointment cancelled | Client email |
| Reschedule notice | Appointment rescheduled | Client email |
| Registration received | Registration submitted | Contact person email |
| Registration approved | Admin approves registration | Contact person email |
| Registration rejected | Admin rejects registration | Contact person email |
| Manager welcome | Manager account created | Manager email |

**Templates:** SES email templates will be created via the SES API and referenced by template name in Lambda code. Templates support variable substitution for business name, appointment details, client name, etc.

### 10.2 SNS — Push Notifications

Two SNS platform applications per environment: one for Android (FCM) and one for iOS (APNs).

| Setting | Value |
|---|---|
| Android platform app | `zapazichas-{env}-android` (GCM/FCM) |
| iOS platform app | `zapazichas-{env}-ios` (APNs) |
| Credentials | FCM server key (Android), APNs certificate/key (iOS) |

**Push token registration flow:**

```
1. Mobile app → POST /api/public/push-token
   Body: { deviceToken, platform: "android"|"ios", bizId, clientPhone }

2. Lambda creates an SNS platform endpoint for the device token.

3. Lambda stores the mapping in DynamoDB:
   PK = PUSH#{deviceToken}, SK = #META
   GSI1PK = BIZ#{bizId}#CLIENT, GSI1SK = {clientPhone}
   Data: { endpointArn, platform, bizId, clientPhone }
```

**Push notification types (derived from PRDs):**

| Notification | Trigger | Recipients |
|---|---|---|
| Booking confirmation | Appointment created (mobile booking) | Client device |
| Appointment reminder | EventBridge schedule fires | Client device |
| Cancellation notice | Appointment cancelled | Client device |
| Reschedule notice | Appointment rescheduled | Client device |

**Delivery logic in reminder Lambda:**

```
1. Look up push tokens for the client:
   Query GSI1: GSI1PK = BIZ#{bizId}#CLIENT, GSI1SK = {clientPhone}

2. For each push token endpoint:
   SNS.publish({ TargetArn: endpointArn, Message: JSON.stringify(payload) })

3. Handle disabled/expired endpoints:
   If SNS returns EndpointDisabled, delete the push token record from DynamoDB.
```

---

## 11. Scheduling

### 11.1 EventBridge Scheduler

Used to create one-time schedules for appointment reminders. Each reminder rule for a business creates a separate schedule per appointment.

| Setting | Value |
|---|---|
| Schedule group | `zapazichas-{env}-reminders` |
| Schedule type | One-time (`at()` expression) |
| Target | Reminder Lambda function |
| Execution role | `zapazichas-{env}-scheduler-role` |
| Retry policy | 2 retries, 1 minute between |
| Dead-letter queue | None (at pre-launch scale; add SQS DLQ at production scale) |
| Flexible time window | Off |
| Auto-delete | `DELETE` after completion |

**Schedule creation flow (in API Lambda):**

```
1. Appointment created (or reminder rule added/modified for a business).

2. For each active reminder rule on the business:
   a. Calculate the reminder fire time:
      - Fixed-time: fire at the configured time on the appointment date
      - Time-anchored: fire at (appointment start - offset)

   b. Skip if fire time is in the past.

   c. Create EventBridge schedule:
      Name: {env}-{bizId}-{aptId}-{remId}
      ScheduleExpression: at(2026-03-01T07:00:00)
      Target: Reminder Lambda ARN
      Input: { bizId, appointmentId, reminderId, type: "reminder" }
      GroupName: zapazichas-{env}-reminders
      ActionAfterCompletion: DELETE

3. When appointment is cancelled or rescheduled:
   Delete all associated schedules by name pattern.
   If rescheduled, recreate schedules with new times.
```

**Confirmation notification scheduling:**
Booking confirmation emails/push are sent synchronously during appointment creation (not via EventBridge). Only reminders use the scheduler.

---

## 12. Security

### 12.1 IAM Roles — Least Privilege

#### API Lambda Role (`zapazichas-{env}-api-role`)

| Permission | Resource | Actions |
|---|---|---|
| DynamoDB | `zapazichas-{env}-main` table + all indexes | `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `BatchGetItem`, `BatchWriteItem` |
| SES | Verified domain identity | `SendEmail`, `SendTemplatedEmail` |
| SNS | Platform application ARNs (`zapazichas-{env}-android`, `zapazichas-{env}-ios`) | `Publish`, `CreatePlatformEndpoint`, `DeleteEndpoint`, `GetEndpointAttributes` |
| EventBridge Scheduler | Schedule group `zapazichas-{env}-reminders` | `CreateSchedule`, `DeleteSchedule`, `GetSchedule` |
| S3 | `zapazichas-{env}-media` bucket | `PutObject` (for pre-signed URL generation) |
| CloudWatch Logs | Log group `/aws/lambda/zapazichas-{env}-api` | `CreateLogGroup`, `CreateLogStream`, `PutLogEvents` |
| IAM | Scheduler execution role | `iam:PassRole` (to pass the scheduler role when creating schedules) |

#### Reminder Lambda Role (`zapazichas-{env}-reminder-role`)

| Permission | Resource | Actions |
|---|---|---|
| DynamoDB | `zapazichas-{env}-main` table + all indexes | `GetItem`, `Query` (read-only) |
| SES | Verified domain identity | `SendEmail`, `SendTemplatedEmail` |
| SNS | Platform application ARNs | `Publish` |
| CloudWatch Logs | Log group `/aws/lambda/zapazichas-{env}-reminder` | `CreateLogGroup`, `CreateLogStream`, `PutLogEvents` |

#### EventBridge Scheduler Role (`zapazichas-{env}-scheduler-role`)

| Permission | Resource | Actions |
|---|---|---|
| Lambda | `zapazichas-{env}-reminder` function ARN | `InvokeFunction` |

#### CloudFront OAC

| Permission | Resource | Actions |
|---|---|---|
| S3 | `zapazichas-{env}-frontend` bucket | `GetObject` |
| S3 | `zapazichas-{env}-media` bucket | `GetObject` |

### 12.2 WAF v2 Rules (Prod Only)

WAF WebACLs for CloudFront **must be created in `us-east-1`**. This requires a separate CDK stack deployed to `us-east-1` with cross-region ARN reference.

| Priority | Rule Name | Type | Configuration | Action |
|---|---|---|---|---|
| 1 | `geo-restrict` | Custom — Geo Match | Allow: AT, BE, BG, HR, CY, CZ, DK, EE, FI, FR, DE, GR, HU, IE, IT, LV, LT, LU, MK, MT, NL, PL, PT, RO, RS, SK, SI, ES, SE, TR | Block non-matching |
| 2 | `rate-limit-global` | Rate-based | 300 requests per 5 minutes per IP | Block |
| 3 | `aws-common-rules` | AWS Managed — AWSManagedRulesCommonRuleSet | Default settings | Block |
| 4 | `aws-known-bad-inputs` | AWS Managed — AWSManagedRulesKnownBadInputsRuleSet | Default settings | Block |
| 5 | `size-constraint` | Custom | Block requests with body > 8 KB | Block |
| Default | — | — | — | Allow |

**WAF cost:** $5/month (WebACL) + $1/month per rule (5 rules = $5) + $0.60/million requests = ~$10/month base.

### 12.3 Encryption

| Resource | Encryption | Key |
|---|---|---|
| DynamoDB | At rest (default) | AWS-owned key (free) |
| S3 buckets | SSE-S3 | S3-managed key (free) |
| Cognito | At rest (default) | AWS-managed |
| CloudFront | In transit (TLS 1.2+) | ACM certificate |
| API Gateway | In transit (TLS 1.2+) | AWS-managed |
| Lambda env vars | At rest | AWS-managed (default) |

All data in transit is encrypted via TLS. CloudFront enforces HTTPS (HTTP redirects to HTTPS). API Gateway is HTTPS-only.

### 12.4 Secrets & Configuration Management

**AWS Systems Manager Parameter Store** for environment-specific configuration.

| Parameter Path | Type | Value |
|---|---|---|
| `/zapazichas/{env}/ses-from-email` | String | `noreply@{domain}` |
| `/zapazichas/{env}/cognito-user-pool-id` | String | Cognito pool ID |
| `/zapazichas/{env}/cognito-client-id` | String | Cognito client ID |
| `/zapazichas/{env}/sns-android-arn` | String | SNS platform app ARN |
| `/zapazichas/{env}/sns-ios-arn` | String | SNS platform app ARN |

**Secrets that should NOT be in code or environment variables:**
- FCM server key → stored in SNS platform application configuration
- APNs certificate → stored in SNS platform application configuration
- Business passwords → stored as bcrypt hashes in DynamoDB (not in Parameter Store)

---

## 13. Monitoring & Observability

### 13.1 CloudWatch Logs

| Log Group | Retention | Source |
|---|---|---|
| `/aws/lambda/zapazichas-{env}-api` | 30 days | API Lambda |
| `/aws/lambda/zapazichas-{env}-reminder` | 30 days | Reminder Lambda |
| `/aws/apigateway/zapazichas-{env}-api` | 14 days | API Gateway access logs (optional, enable if debugging) |

**Structured logging:** Lambda functions should log JSON objects for efficient CloudWatch Insights queries:

```json
{
  "level": "info",
  "message": "Appointment created",
  "bizId": "biz_001",
  "aptId": "apt_123",
  "service": "Haircut",
  "duration": 30,
  "requestId": "lambda-request-id"
}
```

### 13.2 CloudWatch Alarms (Prod)

| Alarm | Metric | Threshold | Period | Action |
|---|---|---|---|---|
| API errors | Lambda `Errors` (API function) | > 5 errors | 5 minutes | SNS email notification |
| API throttles | Lambda `Throttles` (API function) | > 0 | 5 minutes | SNS email notification |
| API latency | Lambda `Duration` p99 (API function) | > 5000 ms | 5 minutes | SNS email notification |
| Reminder errors | Lambda `Errors` (Reminder function) | > 1 error | 15 minutes | SNS email notification |
| API Gateway 5xx | HTTP API `5xx` count | > 10 | 5 minutes | SNS email notification |
| DynamoDB throttles | Table `ThrottledRequests` | > 0 | 5 minutes | SNS email notification |

**Alarm notification:** Create an SNS topic `zapazichas-ops-alerts` with email subscription for the operations team.

### 13.3 Cost Anomaly Detection

Enable AWS Cost Anomaly Detection in the AWS Console (free service). Configure:
- Monitor type: AWS service
- Alert threshold: $5 impact
- Notification: Email to operations team

### 13.4 Budget Alarms

| Budget | Type | Limit | Alert 1 | Alert 2 |
|---|---|---|---|---|
| `zapazichas-monthly` | COST, MONTHLY | $50 USD | At $25 (50%) | At $50 (100%) |

---

## 14. Environment Strategy

### 14.1 Naming Convention

All resources follow the pattern: `zapazichas-{env}-{resource}`

| Environment | Prefix | Purpose |
|---|---|---|
| `dev` | `zapazichas-dev-*` | Development and feature testing |
| `prod` | `zapazichas-prod-*` | Production |

### 14.2 Resource Isolation

| Resource | Isolation Strategy |
|---|---|
| DynamoDB | Separate tables: `zapazichas-dev-main`, `zapazichas-prod-main` |
| Lambda | Separate functions: `zapazichas-dev-api`, `zapazichas-prod-api` |
| API Gateway | Separate HTTP APIs: `zapazichas-dev-api`, `zapazichas-prod-api` |
| S3 | Separate buckets per type per env |
| CloudFront | Separate distributions: dev (no custom domain, no WAF), prod (custom domain, WAF) |
| Cognito | Separate user pools: `zapazichas-dev-users`, `zapazichas-prod-users` |
| EventBridge | Separate schedule groups: `zapazichas-dev-reminders`, `zapazichas-prod-reminders` |
| CloudWatch | Separate log groups and alarms per env |
| WAF | Prod only |
| Route 53 | Shared hosted zone (prod domain only) |
| SES | Shared verified domain |
| SNS platform apps | Separate per env |
| Parameter Store | Separate paths: `/zapazichas/dev/*`, `/zapazichas/prod/*` |
| Budgets | Shared (tracks entire account) |

### 14.3 Environment-Specific Configuration

| Configuration | Dev | Prod |
|---|---|---|
| Lambda reserved concurrency (API) | 10 | 25 |
| Lambda reserved concurrency (Reminder) | 2 | 5 |
| API Gateway throttle — burst | 50 | 100 |
| API Gateway throttle — rate | 25 rps | 50 rps |
| DynamoDB deletion protection | Disabled | Enabled |
| DynamoDB removal policy | DESTROY | RETAIN |
| S3 removal policy | DESTROY | RETAIN |
| CloudFront WAF | None | Attached |
| CloudFront custom domain | None (use default) | `{domain}` |
| CloudWatch log retention | 14 days | 30 days |
| CloudWatch alarms | None | Full alarm set |
| CORS allowed origins | `*` | `https://{domain}` |

---

## 15. Infrastructure as Code (CDK)

### 15.1 CDK Configuration

| Setting | Value |
|---|---|
| CDK version | Latest v2 |
| Language | TypeScript |
| Bootstrap | `cdk bootstrap aws://{ACCOUNT_ID}/eu-central-1` and `aws://{ACCOUNT_ID}/us-east-1` (for WAF) |
| Context variable | `env`: `dev` or `prod` |

### 15.2 Stack Architecture

| Stack | Region | Purpose | Dependencies |
|---|---|---|---|
| `DataStack` | `eu-central-1` | DynamoDB table | None |
| `AuthStack` | `eu-central-1` | Cognito user pool + client | None |
| `MessagingStack` | `eu-central-1` | SES verification, SNS platform apps | None |
| `ComputeStack` | `eu-central-1` | Lambda functions + API Gateway HTTP API | DataStack, AuthStack, MessagingStack |
| `SchedulerStack` | `eu-central-1` | EventBridge Scheduler IAM role + schedule group | ComputeStack |
| `WafStack` | `us-east-1` | WAF WebACL (prod only) | None |
| `NetworkStack` | `eu-central-1` | S3 buckets, CloudFront distributions, Route 53 records | ComputeStack, WafStack (prod) |
| `MonitoringStack` | `eu-central-1` | Budgets, CloudWatch alarms, SNS ops topic | All stacks |

### 15.3 Stack Dependency Order

```
Phase 1 (parallel, no dependencies):
  ├── DataStack
  ├── AuthStack
  ├── MessagingStack
  └── WafStack (us-east-1, prod only)

Phase 2 (depends on Phase 1):
  └── ComputeStack

Phase 3 (depends on Phase 2):
  ├── SchedulerStack
  └── NetworkStack

Phase 4 (depends on all):
  └── MonitoringStack
```

### 15.4 Stack Specifications

#### DataStack

```typescript
// DynamoDB table with single-table design
Table: {
  tableName: `zapazichas-${env}-main`,
  partitionKey: { name: 'PK', type: STRING },
  sortKey: { name: 'SK', type: STRING },
  billingMode: PAY_PER_REQUEST,
  pointInTimeRecovery: true,
  deletionProtection: env === 'prod',
  removalPolicy: env === 'prod' ? RETAIN : DESTROY,
}

GSI1: {
  indexName: 'GSI1',
  partitionKey: { name: 'GSI1PK', type: STRING },
  sortKey: { name: 'GSI1SK', type: STRING },
  projectionType: ALL,
}

GSI2: {
  indexName: 'GSI2',
  partitionKey: { name: 'GSI2PK', type: STRING },
  sortKey: { name: 'GSI2SK', type: STRING },
  projectionType: ALL,
}
```

#### AuthStack

```typescript
UserPool: {
  userPoolName: `zapazichas-${env}-users`,
  selfSignUpEnabled: false,
  signInAliases: { email: true },
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: false,
  },
  mfa: OPTIONAL,
  mfaSecondFactor: { sms: false, otp: true },
  accountRecovery: EMAIL_ONLY,
  customAttributes: {
    role: StringAttribute({ mutable: true }),
    businessId: StringAttribute({ mutable: true }),
  },
}

UserPoolClient: {
  clientName: `zapazichas-${env}-web`,
  authFlows: { userSrp: true },
  preventUserExistenceErrors: true,
  accessTokenValidity: Duration.hours(1),
  refreshTokenValidity: Duration.days(30),
  idTokenValidity: Duration.hours(1),
}
```

#### MessagingStack

```typescript
// SES: Domain identity verification (creates DNS records)
// SNS: Platform applications for push notifications
// Both configured per environment; SES domain shared

SES: {
  configurationSet: 'zapazichas-main',
  // Domain verification handled via Route 53 records
}

SNS_Android: {
  platformApplicationName: `zapazichas-${env}-android`,
  platform: 'GCM',
  // FCM server key provided at deploy time via CDK context or SSM parameter
}

SNS_iOS: {
  platformApplicationName: `zapazichas-${env}-ios`,
  platform: 'APNS',
  // APNs credentials provided at deploy time
}
```

#### ComputeStack

```typescript
ApiFunction: {
  functionName: `zapazichas-${env}-api`,
  runtime: NODEJS_22_X,
  architecture: ARM_64,
  handler: 'index.handler',
  memorySize: 256,
  timeout: Duration.seconds(10),
  reservedConcurrentExecutions: env === 'prod' ? 25 : 10,
  environment: { /* see Section 6.2 */ },
}

ReminderFunction: {
  functionName: `zapazichas-${env}-reminder`,
  runtime: NODEJS_22_X,
  architecture: ARM_64,
  handler: 'index.handler',
  memorySize: 256,
  timeout: Duration.seconds(10),
  reservedConcurrentExecutions: env === 'prod' ? 5 : 2,
  environment: { /* see Section 6.3 */ },
}

HttpApi: {
  apiName: `zapazichas-${env}-api`,
  corsPreflight: null,  // CORS handled by Hono
  defaultStage: {
    throttlingBurstLimit: env === 'prod' ? 100 : 50,
    throttlingRateLimit: env === 'prod' ? 50 : 25,
  },
}

// Routes: see Section 6.1
// JWT Authorizer: see Section 6.1
// IAM grants: see Section 12.1
```

#### SchedulerStack

```typescript
ScheduleGroup: {
  name: `zapazichas-${env}-reminders`,
}

SchedulerRole: {
  roleName: `zapazichas-${env}-scheduler-role`,
  assumedBy: ServicePrincipal('scheduler.amazonaws.com'),
  inlinePolicies: {
    invoke: PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [reminderFunction.functionArn],
    }),
  },
}
```

#### WafStack (us-east-1, prod only)

```typescript
// MUST be deployed to us-east-1 for CloudFront scope
// Cross-region reference: export the WebACL ARN via SSM or CfnOutput
// NetworkStack imports the ARN

WebACL: {
  name: 'zapazichas-prod-waf',
  scope: 'CLOUDFRONT',
  defaultAction: { allow: {} },
  rules: [
    // See Section 12.2 for complete rule definitions
  ],
}
```

#### NetworkStack

```typescript
FrontendBucket: {
  bucketName: `zapazichas-${env}-frontend`,
  blockPublicAccess: BLOCK_ALL,
  encryption: S3_MANAGED,
  removalPolicy: env === 'prod' ? RETAIN : DESTROY,
  autoDeleteObjects: env !== 'prod',
}

MediaBucket: {
  bucketName: `zapazichas-${env}-media`,
  blockPublicAccess: BLOCK_ALL,
  encryption: S3_MANAGED,
  cors: [{
    allowedOrigins: env === 'prod' ? [`https://${domain}`] : ['*'],
    allowedMethods: [PUT],
    allowedHeaders: ['Content-Type'],
    maxAge: 3600,
  }],
}

Distribution: {
  // See Section 5.2 for complete behavior configuration
  // Prod: custom domain, ACM cert, WAF attached
  // Dev: default domain, no WAF
}

// Route 53 records (prod only): see Section 5.1
```

#### MonitoringStack

```typescript
// Budget alarm: see Section 13.4
// CloudWatch alarms (prod only): see Section 13.2
// SNS ops topic for alarm notifications

OpsTopic: {
  topicName: `zapazichas-ops-alerts`,
  // Email subscription added manually or via CDK context
}
```

---

## 16. CI/CD Pipeline

### 16.1 Authentication

Use **OIDC federation** for GitHub Actions → AWS authentication. No long-lived AWS access keys.

```
GitHub Actions → AssumeRoleWithWebIdentity → IAM Role → Deploy
```

Create an IAM role `zapazichas-github-deploy` with trust policy for the GitHub OIDC provider, scoped to the specific repository.

### 16.2 Pipeline Definitions

Three independent pipelines, triggered by changes in their respective directories.

#### Pipeline 1: Infrastructure (`deploy-infra.yml`)

```
Trigger: Push to main, paths: infra/**

Steps:
  1. Checkout code
  2. Configure AWS credentials (OIDC)
  3. Install Node.js 22
  4. npm ci (in infra/)
  5. cdk diff (review changes)
  6. cdk deploy --all --require-approval never
```

#### Pipeline 2: API (`deploy-api.yml`)

```
Trigger: Push to main, paths: api/** or reminder/**

Steps:
  1. Checkout code
  2. Configure AWS credentials (OIDC)
  3. Install Node.js 22
  4. npm ci && npm run build && npm test (in api/)
  5. npm ci && npm run build && npm test (in reminder/)
  6. Package and deploy:
     aws lambda update-function-code --function-name zapazichas-prod-api --zip-file ...
     aws lambda update-function-code --function-name zapazichas-prod-reminder --zip-file ...
  7. Smoke test: curl https://{domain}/api/public/health
```

#### Pipeline 3: Web (`deploy-web.yml`)

```
Trigger: Push to main, paths: web/**

Steps:
  1. Checkout code
  2. Configure AWS credentials (OIDC)
  3. Install Node.js 22
  4. npm ci && npm run build (static export)
  5. aws s3 sync dist/ s3://zapazichas-prod-frontend --delete
  6. aws cloudfront create-invalidation --distribution-id {distId} --paths "/*"
```

### 16.3 Dev Environment Deployment

Dev deployments can be triggered manually or on push to a `dev` branch. Same pipeline structure but targeting dev resources.

---

## 17. API Route Map

Complete API surface derived from the three PRDs. All routes are prefixed with `/api`.

### 17.1 Public Routes (`/api/public/*`) — No auth

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/public/health` | Health check |
| GET | `/api/public/business/code/{code}` | Resolve business by code (mobile app entry) |
| GET | `/api/public/business/slug/{slug}` | Resolve business by slug (web booking page) |
| GET | `/api/public/business/{bizId}/config` | Full business public config (branding, locations, services, employees) |
| GET | `/api/public/business/{bizId}/availability` | Available time slots (query: date, serviceId, locationId) |
| POST | `/api/public/business/{bizId}/appointments` | Create appointment (booking submission) |
| GET | `/api/public/business/{bizId}/appointments/{aptId}` | Get appointment status (client check) |
| POST | `/api/public/business/{bizId}/appointments/{aptId}/cancel` | Client-initiated cancellation |
| POST | `/api/public/registrations` | Submit business registration request |
| POST | `/api/public/push-token` | Register mobile device push token |

### 17.2 Staff Routes (`/api/staff/*`) — Business password in `X-Business-Password` header

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/staff/{bizId}/appointments` | List appointments (query: date, employeeId, status, search) |
| GET | `/api/staff/{bizId}/appointments/{aptId}` | Appointment detail |
| POST | `/api/staff/{bizId}/appointments` | Create appointment (manual/walk-in booking) |
| PUT | `/api/staff/{bizId}/appointments/{aptId}` | Reschedule appointment |
| POST | `/api/staff/{bizId}/appointments/{aptId}/cancel` | Cancel appointment |
| POST | `/api/staff/{bizId}/appointments/{aptId}/complete` | Mark as completed |
| POST | `/api/staff/{bizId}/appointments/{aptId}/noshow` | Mark as no-show |
| GET | `/api/staff/{bizId}/calendar` | Calendar data (query: startDate, endDate, locationId) |
| POST | `/api/staff/{bizId}/blocked-time` | Create blocked time |
| PUT | `/api/staff/{bizId}/blocked-time/{blkId}` | Edit blocked time |
| DELETE | `/api/staff/{bizId}/blocked-time/{blkId}` | Delete blocked time |

### 17.3 Manager Routes (`/api/manager/*`) — Cognito JWT (role: manager)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/manager/{bizId}/config` | Get business configuration |
| PUT | `/api/manager/{bizId}/config` | Update business configuration |
| GET | `/api/manager/{bizId}/branding` | Get branding settings |
| PUT | `/api/manager/{bizId}/branding` | Update branding settings |
| GET | `/api/manager/{bizId}/locations` | List locations |
| POST | `/api/manager/{bizId}/locations` | Create location |
| PUT | `/api/manager/{bizId}/locations/{locId}` | Update location |
| DELETE | `/api/manager/{bizId}/locations/{locId}` | Delete location |
| GET | `/api/manager/{bizId}/services` | List services |
| POST | `/api/manager/{bizId}/services` | Create service |
| PUT | `/api/manager/{bizId}/services/{svcId}` | Update service |
| DELETE | `/api/manager/{bizId}/services/{svcId}` | Delete service |
| GET | `/api/manager/{bizId}/employees` | List employees |
| POST | `/api/manager/{bizId}/employees` | Create employee |
| PUT | `/api/manager/{bizId}/employees/{empId}` | Update employee |
| DELETE | `/api/manager/{bizId}/employees/{empId}` | Delete employee |
| GET | `/api/manager/{bizId}/reminders` | List reminder rules |
| POST | `/api/manager/{bizId}/reminders` | Create reminder rule |
| PUT | `/api/manager/{bizId}/reminders/{remId}` | Update reminder rule |
| DELETE | `/api/manager/{bizId}/reminders/{remId}` | Delete reminder rule |
| GET | `/api/manager/{bizId}/cancellation-policy` | Get cancellation policy |
| PUT | `/api/manager/{bizId}/cancellation-policy` | Update cancellation policy |
| GET | `/api/manager/{bizId}/analytics` | Business analytics |
| GET | `/api/manager/{bizId}/settings` | Business settings (password, slug, managers) |
| PUT | `/api/manager/{bizId}/settings` | Update business settings |
| POST | `/api/manager/{bizId}/logo` | Generate pre-signed URL for logo upload |
| POST | `/api/manager/{bizId}/employees/{empId}/avatar` | Generate pre-signed URL for avatar upload |

### 17.4 Platform Admin Routes (`/api/admin/*`) — Cognito JWT (role: platform_admin)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/businesses` | List all businesses (query: search, status, sort) |
| GET | `/api/admin/businesses/{bizId}` | View business detail |
| POST | `/api/admin/businesses` | Create business directly |
| PUT | `/api/admin/businesses/{bizId}` | Edit business |
| POST | `/api/admin/businesses/{bizId}/suspend` | Suspend business |
| POST | `/api/admin/businesses/{bizId}/reactivate` | Reactivate business |
| POST | `/api/admin/businesses/{bizId}/deactivate` | Deactivate business |
| GET | `/api/admin/registrations` | List registration requests (query: status) |
| GET | `/api/admin/registrations/{regId}` | Registration detail |
| POST | `/api/admin/registrations/{regId}/approve` | Approve (creates business + manager account) |
| POST | `/api/admin/registrations/{regId}/reject` | Reject (with reason) |
| GET | `/api/admin/analytics` | Platform-wide analytics |
| GET | `/api/admin/customers` | Cross-business customer search |
| GET | `/api/admin/settings` | Platform settings |
| PUT | `/api/admin/settings` | Update platform settings |

---

## 18. Cost Estimate

### 18.1 Pre-Launch / Testing Phase

Estimated monthly cost with minimal traffic (< 10,000 requests/month, < 5 businesses, < 100 emails).

| Service | Monthly Cost | Notes |
|---|---|---|
| DynamoDB | $0.00 | On-demand pricing, negligible at low volume |
| Lambda | $0.00 | Free tier: 1M requests + 400K GB-seconds/month |
| API Gateway HTTP API | $0.00 | Free tier: 1M requests/month for 12 months |
| S3 (4 buckets) | ~$0.10 | Minimal storage |
| CloudFront (2 distributions) | ~$0.00 | Free tier: 1TB transfer + 10M requests/month |
| Cognito | $0.00 | Free tier: 50K MAU |
| SES | ~$0.10 | $0.10/1000 emails |
| SNS Mobile Push | ~$0.00 | $0.50/million |
| EventBridge Scheduler | ~$0.00 | $1/million invocations |
| WAF (prod only) | ~$10.00 | $5 WebACL + $5 rules (5 × $1) |
| Route 53 | ~$0.50 | $0.50/hosted zone |
| CloudWatch | ~$0.00 | Free tier: 5GB logs, 10 alarms |
| Parameter Store | $0.00 | Standard parameters are free |
| **Total** | **~$11–15/month** | Well within $25–50 budget |

### 18.2 Early Production Phase

Estimated monthly cost with moderate traffic (100K requests/month, 50 businesses, 5K emails, 500 appointments/day).

| Service | Monthly Cost | Notes |
|---|---|---|
| DynamoDB | ~$2–5 | On-demand reads/writes |
| Lambda | ~$1–3 | Beyond free tier |
| API Gateway HTTP API | ~$0.10 | $1/million requests |
| S3 | ~$0.50 | Growing media storage |
| CloudFront | ~$1–2 | Beyond free tier |
| Cognito | $0.00 | Still within 50K MAU |
| SES | ~$0.50 | 5K emails |
| SNS | ~$0.01 | Push notifications |
| EventBridge | ~$0.01 | Reminder schedules |
| WAF | ~$10.50 | Base + request volume |
| Route 53 | ~$0.90 | Zone + queries |
| CloudWatch | ~$1–2 | Log ingestion |
| **Total** | **~$17–25/month** | |

### 18.3 Cost Protection Mechanisms

| Mechanism | Configuration | Purpose |
|---|---|---|
| Lambda reserved concurrency | API: 25, Reminder: 5 | Hard ceiling on parallel executions |
| API Gateway throttling | Burst: 100, Rate: 50/s | Prevents runaway API costs |
| WAF rate limiting | 300 req/5 min/IP | Stops individual bad actors |
| SES sending limit | 1,000 emails/day (initially) | Prevents email cost spikes |
| AWS Budget alarm | $25 and $50 thresholds | Email alert at spend milestones |
| Cost Anomaly Detection | $5 impact threshold | ML-detected unusual spend |

---

## 19. Repository Structure

Recommended monorepo layout aligned with the CDK stack architecture.

```
zapazichas/
├── infra/                           # AWS CDK infrastructure
│   ├── bin/
│   │   └── app.ts                   # CDK app entry point
│   ├── lib/
│   │   ├── data-stack.ts            # DynamoDB table + GSIs
│   │   ├── auth-stack.ts            # Cognito user pool + client
│   │   ├── messaging-stack.ts       # SES, SNS platform apps
│   │   ├── compute-stack.ts         # Lambda functions + API Gateway
│   │   ├── scheduler-stack.ts       # EventBridge Scheduler role + group
│   │   ├── waf-stack.ts             # WAF WebACL (us-east-1, prod only)
│   │   ├── network-stack.ts         # S3 buckets, CloudFront, Route 53
│   │   └── monitoring-stack.ts      # Budgets, alarms, ops SNS topic
│   ├── cdk.json
│   ├── tsconfig.json
│   └── package.json
│
├── api/                             # Lambda API source code
│   ├── src/
│   │   ├── index.ts                 # Lambda handler entry (Hono app)
│   │   ├── routes/
│   │   │   ├── public/              # No auth
│   │   │   │   ├── booking.ts
│   │   │   │   ├── business.ts
│   │   │   │   └── registration.ts
│   │   │   ├── staff/               # Business password validated in middleware
│   │   │   │   ├── calendar.ts
│   │   │   │   ├── blocked-time.ts
│   │   │   │   └── appointments.ts
│   │   │   ├── manager/             # Cognito JWT (manager role)
│   │   │   │   ├── business-config.ts
│   │   │   │   ├── services.ts
│   │   │   │   ├── employees.ts
│   │   │   │   ├── locations.ts
│   │   │   │   ├── reminders.ts
│   │   │   │   ├── analytics.ts
│   │   │   │   └── cancellation-policy.ts
│   │   │   └── admin/               # Cognito JWT (platform_admin role)
│   │   │       ├── businesses.ts
│   │   │       ├── registrations.ts
│   │   │       ├── platform-analytics.ts
│   │   │       └── settings.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification, role extraction
│   │   │   ├── business-password.ts # Shared password validation
│   │   │   └── error-handler.ts     # Global error handling
│   │   ├── services/                # Business logic layer
│   │   │   ├── booking.service.ts
│   │   │   ├── availability.service.ts
│   │   │   ├── appointment.service.ts
│   │   │   ├── reminder.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── business.service.ts
│   │   ├── db/                      # DynamoDB access layer
│   │   │   ├── client.ts            # DynamoDB DocumentClient singleton
│   │   │   ├── keys.ts              # PK/SK/GSI key builders
│   │   │   ├── business.repo.ts
│   │   │   ├── appointment.repo.ts
│   │   │   ├── employee.repo.ts
│   │   │   └── ...
│   │   └── types/                   # Shared TypeScript types
│   │       ├── business.ts
│   │       ├── appointment.ts
│   │       └── ...
│   ├── tsconfig.json
│   └── package.json
│
├── reminder/                        # Reminder Lambda source code
│   ├── src/
│   │   ├── index.ts                 # Handler: EventBridge event → notification
│   │   ├── channels/
│   │   │   ├── email.ts             # SES delivery
│   │   │   └── push.ts             # SNS push delivery
│   │   └── templates/               # Notification content templates
│   │       ├── confirmation.ts
│   │       ├── reminder.ts
│   │       ├── cancellation.ts
│   │       └── reschedule.ts
│   ├── tsconfig.json
│   └── package.json
│
├── web/                             # Frontend SPA
│   ├── src/
│   │   └── ...                      # Framework TBD (React recommended)
│   ├── tsconfig.json
│   └── package.json
│
├── mobile/                          # Mobile app
│   └── ...                          # Framework TBD (React Native recommended)
│
├── .github/
│   └── workflows/
│       ├── deploy-infra.yml
│       ├── deploy-api.yml
│       └── deploy-web.yml
│
├── package.json                     # Workspace root (npm workspaces)
├── tsconfig.base.json               # Shared TS config
└── README.md
```

---

## Appendix A: AWS Account Bootstrap Checklist

Steps to prepare the AWS account before the first CDK deployment.

1. **Configure AWS CLI credentials** (SSO or IAM user with AdministratorAccess for initial setup)
2. **Bootstrap CDK** in both required regions:
   ```
   cdk bootstrap aws://{ACCOUNT_ID}/eu-central-1
   cdk bootstrap aws://{ACCOUNT_ID}/us-east-1
   ```
3. **Register domain** and create Route 53 hosted zone (when domain is finalized)
4. **Request SES production access** via AWS Console (move out of sandbox)
5. **Verify domain in SES** (add DKIM + SPF DNS records)
6. **Enable Cost Anomaly Detection** in AWS Console
7. **Set up GitHub OIDC provider** for CI/CD authentication
8. **Obtain FCM server key** (for Android push via SNS)
9. **Obtain APNs credentials** (for iOS push via SNS)

## Appendix B: Glossary

| Term | Definition |
|---|---|
| **Monolambda** | Single Lambda function handling all API routes via an internal router (Hono) |
| **Single-table design** | DynamoDB pattern where all entity types share one table, distinguished by composite key patterns |
| **OAC** | Origin Access Control — CloudFront mechanism to privately access S3 without making buckets public |
| **GSI** | Global Secondary Index — alternate key structure on a DynamoDB table enabling different query patterns |
| **Pre-signed URL** | Time-limited S3 URL that grants temporary upload permission to a specific key |
| **EventBridge Scheduler** | AWS service for creating one-time or recurring schedules that invoke targets (Lambda, etc.) |
| **WAF** | Web Application Firewall — inspects HTTP requests and blocks malicious traffic |
| **CDK** | AWS Cloud Development Kit — Infrastructure as Code framework using TypeScript |
| **SPA** | Single Page Application — frontend architecture where the browser loads one HTML page and handles routing client-side |
| **Hono** | Lightweight (14KB) TypeScript web framework designed for serverless and edge environments |

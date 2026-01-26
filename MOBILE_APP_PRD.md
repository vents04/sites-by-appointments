# Product Requirements Document (PRD): Sites By Appointments Mobile App

## 1. Executive Summary
The goal is to develop a generic mobile application (iOS & Android) that serves as a platform for various beauty salons and service-based businesses. Unlike a marketplace, this app operates as a white-label container. Users enter a unique **Business Code** upon launch, which dynamically configures the app to serve as the dedicated booking interface for that specific business.

Reference Web Implementation: [https://kerelski.com/book](https://kerelski.com/book)

Additionally, the app supports an **Admin Mode**, accessible via a specific code entry, allowing business owners/staff to manage their schedule directly from the app.

## 2. Target Audience
- **Primary**: End-customers of individual beauty salons.
- **Secondary**: Business owners and staff (Admin users).

## 3. Core Features (MVP)

### 3.1 Onboarding & Business Context (The "Enter Code" Flow)
- **Entry Screen**: The first screen users see is a clean interface prompting them to "Enter Business Code".
- **Code Resolution**: 
  - The app validates the code against the backend.
  - If valid, the app retrieves the business configuration (Branding, Locations, Services).
  - The app "transforms" into that business's app (persisted state).
- **Switching Businesses**: Option in settings to "Change Business" or "Logout", returning the user to the Code Entry screen.

### 3.2 Customer Mode Features
**Appointment Booking Flow (Wizard)**
Revised flow to prioritize service and time availability:

**Step 1: Service Selection**
- **Service**: User selects the desired service first.
- **(Optional) Location**: If the business has multiple locations, user may need to filter/select location here or it is pre-determined.

**Step 2: Date & Time Selection**
- **Date**: Calendar view to pick a specific date.
- **Time Slots**: Display available time slots for the selected service.
- **Employee Visibility**: Each time slot displays small profile pictures (avatars) of the employees available for that specific service at that time.

**Step 3: Employee Selection**
- User taps a time slot and is presented with the specific employees available at that time.
- User selects their preferred employee.

**Step 4: Personal Information**
- Inputs: Name, Phone, Email.
- **Optimization**: Auto-fill from local storage.

**Step 5: Confirmation**
- Booking summary and submission.

**My Appointments (Client)**
- Local history of booked appointments stored on the device.
- Status tracking (if API supports status updates).
- **Cancellation**: Users can cancel an appointment directly from the app, but only if it is more than 24 hours before the scheduled time.

**Notifications & Reminders**
- **Push Notifications**: Receive reminders for upcoming appointments (e.g., 24h before, 1h before).
- **Status Updates**: Notifications when an appointment is confirmed or cancelled by the business.

### 3.3 Admin Mode Features
- **Access**: Triggered by entering a specific "Admin Code" or a special pattern in the main code entry screen (to be defined, e.g., a specific prefix or separate toggle).
- **Authentication**: Once the admin code is recognized, prompt for Admin Credentials (if distinct from the code) or use the code as the auth key (if simple).
- **Dashboard & Management (Extended Control)**:
  - **Calendar View**: A comprehensive calendar screen similar to the **TeamUp** application interface.
    - Features: Color-coded events, multiple views (Day, 3-Day, Week, Month), and easy navigation.
    - Resource View: Columns for different employees if applicable.
  - **Appointments List View**: A dedicated screen listing all appointments in a linear format.
    - **Filters**: Located at the top of the screen (e.g., Filter by Date Range, Employee, Service, Status).
    - **Search**: Search by customer name or phone number.
  - **Appointment Management**: Ability to Cancel, Reschedule, or Edit customer appointments.
  - **Schedule Management**: Block off time slots (e.g., lunch breaks, holidays).
  - **Service Management**: Toggle availability of services.

### 3.4 Contact & Information
- Display location details (Address, Phone).
- Click-to-call functionality.
- Link to Privacy Policy.

## 4. Technical Architecture

### 4.1 Frontend (Mobile)
- **Framework**: React Native (Expo).
- **State Management**:
  - Global Store (Zustand/Context) to hold the `currentBusinessId` and `userMode` (Client vs Admin).
  - Persistence: `AsyncStorage` to remember the last used Business Code so the user doesn't have to re-enter it every time.

### 4.2 Backend (API)
- **New Endpoint**: `GET /business/lookup/:code` 
  - Resolves a user-friendly code (e.g., "STYLE123") to a Business ID/Domain.
  - Existing `getBusiness` by domain might need adaptation to support this "Code" lookup or we simply map Code -> Domain/ID in the DB.

### 4.3 Data Models
- **Business Model Update**: May need a `uniqueCode` field if one doesn't exist, to facilitate easy entry.

### 4.4 Infrastructure (AWS)
- **Provider**: Amazon Web Services (AWS) to host all components.
- **API Hosting**: AWS Elastic Beanstalk or ECS (Fargate) for the Node.js/Express API.
- **Database**: MongoDB hosted on EC2 (self-managed) or MongoDB Atlas (AWS region peered).
- **Web Frontend**: AWS Amplify or S3 + CloudFront (if static export) or Elastic Beanstalk (if SSR).
- **Mobile App**: 
  - Build artifacts (APK/IPA) generated via local build or CI/CD pipeline.
  - Backend connectivity via standard HTTPS REST API calls to the AWS endpoints.
- **Storage**: AWS S3 for storing business logos and assets.

## 5. User Flows

### Flow 1: First Time User (Client)
1. Open App -> **Enter Code Screen**.
2. User enters "SALON1".
3. API validates -> Returns Business Data.
4. App transitions to **Business Home** (Service Selector).
5. User selects Service -> Selects Date.
6. User sees Time Slots with employee avatars -> Selects Time.
7. User selects specific Employee.
8. User enters details -> Confirms.

### Flow 2: Admin User
1. Open App -> **Enter Code Screen**.
2. User enters Admin Code (e.g., "ADMIN-SALON1" or toggles "I am a Business").
3. App prompts for Password/Pin (if required).
4. App transitions to **Admin Dashboard**.
5. Admin views schedule.

### Flow 3: Returning User
1. Open App.
2. App detects stored Business Context.
3. Skips "Enter Code".
4. Loads **Business Home** immediately.


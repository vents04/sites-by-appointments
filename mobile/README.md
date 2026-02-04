# GoBarber Mobile App

A React Native (Expo) mobile application for appointment booking, serving both customers and business administrators.

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Navigation**: Expo Router (file-based)
- **State Management**: Zustand with AsyncStorage persistence
- **Styling**: Custom theme provider with dynamic business colors
- **Localization**: i18next (Bulgarian default + English)
- **Forms**: React Hook Form with Zod validation
- **Animations**: React Native Reanimated

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

## Project Structure

```
mobile/
├── app/                    # Expo Router pages
│   ├── (auth)/             # Authentication screens
│   ├── (customer)/         # Customer app (tabs)
│   │   ├── book/           # Booking flow
│   │   ├── appointments/   # Appointments list
│   │   └── settings/       # Settings
│   └── (admin)/            # Admin app (tabs)
│       ├── dashboard/
│       ├── calendar/
│       ├── appointments/
│       └── settings/
├── src/
│   ├── components/         # Reusable components
│   │   └── ui/             # Base UI components
│   ├── stores/             # Zustand stores
│   ├── services/           # API services
│   │   └── mock/           # Mock data & API
│   ├── theme/              # Theme configuration
│   ├── i18n/               # Translations
│   └── types/              # TypeScript types
```

## Mock Data

For development, the app uses mock data defined in `src/services/mock/mockData.ts`.

### Test Credentials

| Business | Code | Admin Password |
|----------|------|----------------|
| Elegant Hair Studio | `elegant-hair` | `admin123` |
| Downtown Barbers | `downtown-barbers` | `admin456` |

## Features

### Customer App
- ✅ Business code entry
- ✅ Location selection (auto-skip if single)
- ✅ Employee selection with "Anyone available" option
- ✅ Service selection
- ✅ Date & time picker with calendar
- ✅ Personal data form (remembered for returning users)
- ✅ Booking confirmation
- ✅ Success screen with animations
- ✅ Appointments list (upcoming/past)
- ✅ "Book Again" for past appointments
- ✅ Settings (language, notifications, leave business)

### Admin App
- ✅ Admin login with password
- ✅ Dashboard with today's stats
- ✅ Calendar view with day schedule
- ✅ Appointments list with search/filter
- ✅ Quick actions (call, edit, cancel)
- ✅ Create booking for walk-ins
- ✅ Settings

### Technical Features
- ✅ Offline-first with AsyncStorage caching
- ✅ Bilingual (Bulgarian/English)
- ✅ Dynamic theming based on business branding
- ✅ Persistent user preferences
- ✅ Smart step-skipping in booking flow

## Theming

Each business can customize:
- Primary color (affects buttons, progress bar, accents)
- Logo

The theme is applied dynamically when the business code is validated.

## Localization

Default language is Bulgarian. Users can switch to English in settings.

Translation files are located in:
- `src/i18n/bg.json`
- `src/i18n/en.json`

## Environment

Currently using mock data. For production:

1. Delete `src/services/mock/` folder
2. Update API client in `src/services/api/` to use real endpoints
3. Configure environment variables

## License

Private - Ventsi Dimitrov

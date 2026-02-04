# Sites By Appointments API

Multi-tenant appointment booking API for service-based businesses.

## Features

- **Multi-tenant SaaS**: Single database, business isolation via codes
- **JWT Authentication**: Monthly token expiration with refresh
- **Real-time Updates**: WebSocket support via Socket.io
- **i18n**: Bulgarian (default) and English support
- **ICS Export**: RFC 5545 compliant calendar export
- **UTC-first**: All dates in UTC, client-side timezone conversion

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- MongoDB 6+
- Redis 7+ (optional, for sessions/caching)

### Installation

```bash
cd api-new
npm install
```

### Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SUPER_ADMIN_KEY` - API key for super admin endpoints

### Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

### Testing

```bash
npm test
npm run test:coverage
```

## API Structure

### Authentication
- `POST /v1/auth/login` - Login with business code + password
- `POST /v1/auth/refresh` - Refresh token
- `POST /v1/auth/logout` - Logout

### Public Endpoints (no auth)
- `GET /v1/businesses/lookup/:code` - Lookup business by code
- `GET /v1/businesses/:id/services` - List services
- `GET /v1/businesses/:id/employees` - List employees
- `GET /v1/businesses/:id/locations` - List locations
- `GET /v1/businesses/:id/availability` - Get available slots
- `POST /v1/bookings` - Create booking
- `GET /v1/bookings/:id` - Get booking
- `DELETE /v1/bookings/:id` - Cancel booking

### Business Admin (JWT required)
- `GET /v1/business/profile` - Get business profile
- `PUT /v1/business/profile` - Update profile
- CRUD for `/v1/business/employees`
- CRUD for `/v1/business/services`
- CRUD for `/v1/business/locations`
- CRUD for `/v1/business/events`
- `/v1/business/bookings` management
- `/v1/business/customers` management

### Super Admin (x-super-admin-key header)
- `GET /v1/admin/stats` - Platform statistics
- CRUD for `/v1/admin/businesses`
- Password reset, suspend, activate

## WebSocket Events

Connect with JWT token:
```javascript
const socket = io('wss://api.example.com', {
  auth: { token: 'Bearer <jwt>' }
});

socket.emit('join_business_room', { businessId: '...' });
socket.on('event_created', (data) => { ... });
socket.on('event_updated', (data) => { ... });
socket.on('event_deleted', (data) => { ... });
```

## Documentation

See `/docs` folder for detailed documentation:
- `01-ARCHITECTURE.md` - System architecture
- `02-TECH-STACK.md` - Technology choices
- `03-DATA-MODELS.md` - MongoDB schemas
- `04-API-ENDPOINTS.md` - Full API reference
- `05-IMPLEMENTATION.md` - Development guidelines

## Project Structure

```
api-new/
├── src/
│   ├── config/          # Configuration
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── validators/      # Zod schemas
│   ├── websocket/       # Socket.io setup
│   ├── i18n/            # Translations
│   ├── utils/           # Utilities
│   ├── app.js           # Express app
│   └── server.js        # Entry point
├── tests/
│   ├── integration/     # API tests
│   └── unit/            # Unit tests
├── docs/                # Documentation
└── package.json
```

## License

ISC

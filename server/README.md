# UptimeHost Backend — Node.js/Express + PostgreSQL

## Quick Start

```bash
cd server

# 1. Install dependencies
npm install

# 2. Create PostgreSQL database
createdb uptimehost

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# 4. Run migrations
npm run migrate

# 5. Seed demo data
npm run seed

# 6. Start server
npm run dev
```

Server runs on `http://localhost:3001` by default.

## API Endpoints

### Auth
- `POST /api/auth/login` — Login (returns JWT)
- `GET /api/auth/me` — Current user
- `POST /api/auth/logout` — Logout

### Monitors
- `GET /api/monitors` — List (filterable by env, account, status, search)
- `GET /api/monitors/:id` — Get one
- `POST /api/monitors` — Create (admin+)
- `PUT /api/monitors/:id` — Update (admin+)
- `DELETE /api/monitors/:id` — Delete (admin+)
- `POST /api/monitors/:id/pause` — Pause (admin+)
- `POST /api/monitors/:id/resume` — Resume (admin+)

### Incidents
- `GET /api/incidents` — List all
- `POST /api/incidents/:id/acknowledge` — Acknowledge (admin+)
- `POST /api/incidents/:id/resolve` — Resolve (admin+)

### Alerts
- `GET /api/alerts` — List all
- `PUT /api/alerts/:id/read` — Mark read

### Maintenance
- `GET /api/maintenance` — List all
- `POST /api/maintenance` — Create (admin+)
- `PUT /api/maintenance/:id/cancel` — Cancel (admin+)

### Dashboard
- `GET /api/dashboard/stats` — Dashboard statistics

### Reports
- `GET /api/reports/downtime-events` — Downtime events
- `GET /api/reports/uptime` — Uptime reports

### Users
- `GET /api/users` — List (admin+)
- `POST /api/users` — Create/invite (super_admin)
- `PUT /api/users/:id/role` — Change role (super_admin)
- `DELETE /api/users/:id` — Deactivate (super_admin)

### Organization
- `GET /api/organizations/current` — Current org details
- `PUT /api/organizations/current` — Update org (super_admin)

### Other
- `GET /api/health` — Health check
- `GET /api/audit-logs` — Audit logs (admin+)
- `GET /api/status-pages` — Status pages
- `POST /api/status-pages` — Create status page (admin+)

## Demo Credentials
- **Super Admin:** superadmin@uptimehost.com / admin123
- **Admin:** admin@uptimehost.com / admin123
- **Viewer:** viewer@uptimehost.com / viewer123

## Architecture
- JWT authentication with role-based access (super_admin, admin, viewer)
- Multi-tenant with organization-level data isolation
- Cron-based URL monitoring (every 60 seconds)
- Automatic alerts on downtime
- Full audit logging

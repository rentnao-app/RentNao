# RentNao

RentNao is a role-based rental platform designed for the Bangladesh market, connecting tenants and property owners through a verified onboarding and listing workflow.

This repository contains the full business application stack:
- Customer-facing web app (tenant/owner/admin experiences)
- Backend API and business logic

## Business Context

RentNao is structured as a trust-first rental marketplace. The product emphasizes:
- **Verified onboarding** for both tenants and owners
- **Role-based journeys** from sign-up to dashboard access
- **Operational readiness** with audit-friendly modules (auth, wallet, requests, notifications)

Core onboarding flow:
1. User signs up (email/password or Google) and selects role.
2. User completes role-specific registration (`tenant` or `owner`).
3. User submits verification documents.
4. User is routed to role dashboard for operational use.

## Repository Structure

```text
RentNao/
├── README.md                # This document (business + technical entry point)
├── backend/                 # Hono/Bun API, DB access, auth, wallet, modules
└── frontend/                # React/Vite application (tenant/owner/admin UX)
```

## Platform Architecture

### Frontend (`frontend`)
- React + Vite single-page application
- Role-based pages and guarded routes
- Integrates with backend via `VITE_API_URL`
- Handles signup, onboarding, listings, requests, wallet, notifications

### Backend (`backend`)
- TypeScript + Hono + Bun
- Module-oriented domain structure (`auth`, `users`, `properties`, `wallet`, etc.)
- PostgreSQL via Prisma, with Redis and MinIO in local Docker stack
- JWT-based auth and refresh-token flows
- Google OAuth support with secure code exchange

## Quick Start (Local Development)

## 1) Prerequisites

- Node.js 20+
- Bun (latest stable)
- Docker + Docker Compose

## 2) Clone and install

```bash
git clone <your-repo-url>
cd RentNao
```

### Backend setup

```bash
cd backend
bun install
cp .env.example .env
docker compose up -d
bun run db:push
bun run dev
```

Backend default URL: `http://localhost:3000`

### Frontend setup

```bash
cd ../frontend
npm install
cp .env.example .env
npm run dev
```

Frontend default URL: `http://localhost:5173`

## Environment Configuration

At minimum, verify these areas before running:

- **Frontend**
  - `VITE_API_URL` -> backend API base URL
  - `VITE_GOOGLE_AUTH_URL` -> backend Google OAuth initiate endpoint

- **Backend**
  - DB connection string
  - JWT secret(s)
  - Google OAuth credentials
  - Redis/MinIO configuration for local services

Use each service’s own README for complete variable definitions:
- `backend/README.md`
- `frontend/README.md`

## Operational Notes

- Role routing is central to business logic:
  - Signup -> role registration -> verification -> role dashboard
- Admin workflows depend on submitted verification artifacts.
- Payment behavior in local development should be validated against the backend adapters.
- Keep environment files out of version control.

## Database Backups (Option A)

This repo includes a host-based backup script for the Docker Postgres container.

**Script:** `scripts/db-backup.sh`

**Defaults:**
- Reads `POSTGRES_*` from `.env.service`
- Stores backups in `./backups/`
- Retains backups for 30 days

**Run manually:**
```bash
bash scripts/db-backup.sh
```

**Cron example (daily at 2:00 AM):**
```cron
0 2 * * * cd /home/dreamboat/RentNao && bash scripts/db-backup.sh >> backups/backup.log 2>&1
```

**Restore example:**
```bash
# Pick a backup file from ./backups
docker exec -i rentnao-postgres pg_restore -U user -d rentnao --clean --if-exists < backups/rentnao_YYYYMMDD_HHMMSS.dump
```

## Quality and Governance

Recommended checks before merging:
- Run frontend lint/build and backend lint/build locally.
- Validate onboarding and role-routing flows end-to-end.
- Confirm no credentials/secrets are committed.
- Keep API and UI behavior aligned when updating auth or onboarding.

## Additional Documentation

- Backend technical details: `backend/README.md`
- Frontend routes and UX notes: `frontend/README.md`
- Frontend testing guidance: `frontend/TESTING_GUIDE.md`

## License

This project is proprietary unless otherwise specified by the repository owner.
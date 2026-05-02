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
1. User signs up (email/password, phone, or Google) and selects role.
2. User completes role-specific registration (`tenant` or `owner`).
3. User submits verification documents.
4. User is routed to role dashboard for operational use.

## Repository Structure

```text
RentNao/
├── README.md                      # This document (business + technical entry point)
├── docker-compose.service.yml     # Local infra: Postgres, Redis, MinIO
├── docker-compose.app.yml         # Optional: backend + frontend images + Caddy
├── Caddyfile                      # Used by docker-compose.app.yml
├── .env.service.example           # Template for service compose (copy to .env.service)
├── .env.app.example               # Template for app compose (copy to .env.app)
├── scripts/
│   └── db-backup.sh               # Host backup for Postgres container
├── .github/workflows/
│   └── deploy.yml                 # GHCR image builds on push to main
├── backend/                       # Hono/Bun API, Prisma, auth, wallet, modules
└── frontend/                      # React/Vite SPA (tenant/owner/admin UX)
```

## Platform Architecture

### Frontend (`frontend`)
- React + Vite single-page application
- Role-based pages and guarded routes
- Integrates with backend via `VITE_API_URL`
- Handles signup, onboarding, listings, requests, wallet, notifications

### Backend (`backend`)
- TypeScript + Hono + Bun
- Module-oriented domain structure (`auth`, `users`, `properties`, `wallet`, `wishlists`, `rental-requests`, `notifications`, `admin`, etc.)
- PostgreSQL via Prisma, with Redis and MinIO in local Docker stack
- JWT-based auth and refresh-token flows
- Google OAuth support with secure code exchange

## Quick Start (Local Development)

### 1) Prerequisites

- Node.js 20+
- Bun (latest stable)
- Docker + Docker Compose

### 2) Clone

```bash
git clone <your-repo-url>
cd RentNao
```

### 3) Start infrastructure (from repository root)

Postgres, Redis, and MinIO are defined at the repo root (not inside `backend/`).

```bash
cp .env.service.example .env.service   # once; edit POSTGRES_* if needed
docker compose -f docker-compose.service.yml --env-file .env.service up -d
```

Wait until the containers are healthy, then continue.

### 4) Backend

```bash
cd backend
bun install
cp .env.example .env
# Ensure DATABASE_URL, REDIS_*, and S3_* in .env match your .env.service / local ports
bun run db:push
bun run dev
```

Backend default URL: `http://localhost:3000`  
OpenAPI UI: `http://localhost:3000/docs`

### 5) Frontend

```bash
cd ../frontend
npm install
cp .env.example .env
# Set VITE_API_URL (and VITE_GOOGLE_AUTH_URL if using Google) in .env
npm run dev
```

Frontend default URL: `http://localhost:5173`

### Optional: full app stack with Caddy

For containerized backend + frontend behind Caddy, see `docker-compose.app.yml` and `.env.app.example`.

## Environment Configuration

At minimum, verify these areas before running:

- **Frontend** (`frontend/.env`)
  - `VITE_API_URL` — backend API base URL
  - `VITE_GOOGLE_AUTH_URL` — backend Google OAuth initiate endpoint (if using Google)

- **Backend** (`backend/.env`)
  - `DATABASE_URL` — must reach the Postgres started by `docker-compose.service.yml`
  - JWT secret(s)
  - Google OAuth credentials (if enabled)
  - Redis and S3/MinIO endpoints for local services

- **Compose** (root)
  - `.env.service` — credentials and DB name for `docker-compose.service.yml`
  - `.env.app` — image tags and app wiring for `docker-compose.app.yml`

Use each service’s README for variable details:
- `backend/README.md`
- `frontend/README.md`

## Operational Notes

- Role routing is central to business logic:
  - Signup → role registration → verification → role dashboard
- Admin workflows depend on submitted verification artifacts.
- Payment and wallet behavior in local development should be validated against backend configuration.
- Keep environment files out of version control.

## Database Backups (Option A)

This repo includes a host-based backup script for the Docker Postgres container.

**Script:** `scripts/db-backup.sh`

**Defaults:**
- Reads `POSTGRES_*` from `.env.service`
- Stores backups in `./backups/`
- Retains backups for 30 days

**Run manually (from repo root):**

```bash
bash scripts/db-backup.sh
```

**Cron example (daily at 2:00 AM):**

```cron
0 2 * * * cd /path/to/RentNao && bash scripts/db-backup.sh >> backups/backup.log 2>&1
```

**Restore example:**

```bash
# Pick a backup file from ./backups
docker exec -i rentnao-postgres pg_restore -U user -d rentnao --clean --if-exists < backups/rentnao_YYYYMMDD_HHMMSS.dump
```

Adjust `-U` and database name to match your `.env.service` values.

## Quality and Governance

Recommended checks before merging:
- Run frontend lint/build and backend lint/build locally.
- Validate onboarding and role-routing flows end-to-end.
- Confirm no credentials/secrets are committed.
- Keep API and UI behavior aligned when updating auth or onboarding.

## Additional Documentation

- Backend technical details: `backend/README.md`
- Frontend routes and client notes: `frontend/README.md`
- Frontend testing guidance: `frontend/TESTING_GUIDE.md`

## License

This project is proprietary unless otherwise specified by the repository owner.

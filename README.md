# RentNao

RentNao is a trust-first rental marketplace for Bangladesh. Tenants and owners complete verified onboarding, then use role-based dashboards for listings, requests, chat, wallet, and admin review.

**For Claude / agents:** start with [`CLAUDE.md`](CLAUDE.md). It is the source of truth for commands, ports, and what is *not* in this repo.

## Stack

| Layer | Path | Tech |
|-------|------|------|
| Web app | `frontend/` | React 19, Vite 7, Tailwind, react-router-dom 7, EN/BN i18n, Google Maps |
| API | `backend/` | Hono, Bun, Prisma, PostgreSQL, Redis, MinIO/S3 |
| Local infra | `backend/docker-compose.yml` | Postgres **5433**, Redis 6379, MinIO 9000/9001 |
| Edge RL (template) | `infra/caddy-ratelimit/` | Custom Caddy + mholt rate limit (VPS apply is manual) |
| CI | `.github/workflows/deploy.yml` | GHCR images on push to **`main`**, SSH deploy |

Roles: **TENANT**, **OWNER**, **ADMIN**.

## Onboarding flow

1. Sign up (phone, email/password, or Google) and pick a role.
2. Complete tenant or owner registration.
3. Submit KYC / verification documents.
4. Use the role dashboard (listings, requests, chat, wallet).

## Repository layout

```text
RentNao/
├── CLAUDE.md                      # Agent / Claude Pro context (read first)
├── README.md                      # This file
├── .github/workflows/deploy.yml   # Production deploy (main only)
├── backend/                       # API + local Docker infra
│   └── docker-compose.yml         # Postgres, Redis, MinIO
├── frontend/                      # SPA
├── infra/caddy-ratelimit/         # Custom Caddy image + example Caddyfile
└── scripts/db-backup.sh           # Postgres dump (needs POSTGRES_* env)
```

**Not in this repo** (production-only, on the VPS):

- `docker-compose.app.yml` / `docker-compose.service.yml`
- Root `Caddyfile`, `.env.app`, `.env.service`

Do not recreate those here unless you are deliberately moving infra into git.

## Quick start (local)

### Prerequisites

- Node.js 20.19+ or 22.12+ (Vite 7)
- Bun (latest stable)
- Docker + Docker Compose

### 1. Infrastructure

```bash
cd backend
docker compose up -d
docker ps   # rentnao-postgres, rentnao-redis, rentnao-minio
```

Postgres is published as **`localhost:5433`** so it does not clash with a host Postgres on 5432.

### 2. Backend

```bash
cd backend
bun install
cp .env.example .env
# Set DATABASE_URL to port 5433 (see below)
bun run db:push    # or: bunx prisma migrate deploy
bun run dev
```

- API: http://localhost:3000
- OpenAPI: http://localhost:3000/docs

```env
DATABASE_URL="postgresql://user:password@127.0.0.1:5433/rentnao?schema=public"
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL=http://localhost:3000
# VITE_GOOGLE_MAPS_API_KEY=...   # required for MapPicker / MapView
npm run dev
```

- SPA: http://localhost:5173
- Dev server proxies API paths (`/auth`, `/properties`, …) to `:3000`.  
  `[vite] http proxy error` + `ECONNREFUSED` means the backend is down.

## Environment (minimum)

**Frontend** (`frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API origin (no `/api` prefix on paths) |
| `VITE_GOOGLE_AUTH_URL` | `…/auth/google` if using Google login |
| `VITE_GOOGLE_MAPS_API_KEY` | Maps JavaScript API (baked in at **build** time in Docker) |

Ignore leftover `VITE_SUPABASE_*` keys in `.env.example` — the app does not use Supabase.

**Backend** (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres on **5433** locally |
| `JWT_SECRET` | Auth |
| `REDIS_HOST` / `REDIS_PORT` | Cache / rate limit / sessions |
| `S3_*` | MinIO locally; `S3_PUBLIC_ENDPOINT` is `https://cdn.rentnao.co` in prod |
| `CORS_ORIGIN` | Include `http://localhost:5173` |

Optional: `GOOGLE_CLIENT_*`, `FIREBASE_*` (FCM), `KYC_BD_*`, SMS OTP (`BULKSMSBD_*`).

Details: `backend/README.md`, `frontend/README.md`.

## Branches and deploy

| Branch | Purpose |
|--------|---------|
| `main` | Production. GitHub Actions deploys **only** from `main` |
| `merge` | Integration. Land `plabon` / `arefin` / `nihal` here first |
| `plabon` | Frontend / homepage / i18n |
| `arefin` | Backend features (deals, chat, FCM, KYC) |
| `nihal` | Smaller UI/footer work |

Typical flow: feature branch → `merge` → PR into `main` → Actions builds GHCR `:latest` + SHA tags → VPS `docker compose pull && up`.

Frontend env (`VITE_*`) is injected as **Docker build args**. Updating a GitHub secret does nothing until the frontend image is rebuilt.

After new Prisma migrations on production:

```bash
cd /home/rentnao_admin/opt/rentnao/app
docker compose exec backend bunx prisma migrate deploy
docker compose restart backend
```

Live: https://rentnao.co — API: https://api.rentnao.co — files: https://cdn.rentnao.co

## Production notes

- **Bandwidth:** public CDN (`cdn.rentnao.co` → MinIO) previously burned ~5 TB outbound. Edge rate limiting lives in `infra/caddy-ratelimit/` and still needs applying on the VPS infra Caddy.
- **502 on API:** check Caddy/TLS/DNS, not only the backend process. Backend `/health` can be 200 while `https://api.rentnao.co` is 502.
- **Stale UI:** frontend container image is often weeks old if `build-frontend` was skipped or `docker pull` failed (HostTier throttle).
- Keep secrets out of git.

## Database backups

`scripts/db-backup.sh` dumps the `rentnao-postgres` container. It expects `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` in an env file (`ENV_FILE`, default `.env.service` which is **not** in the repo).

```bash
# Example: export vars or point at a local env file
ENV_FILE=./.env.backup bash scripts/db-backup.sh
```

Restore:

```bash
docker exec -i rentnao-postgres pg_restore -U user -d rentnao --clean --if-exists < backups/rentnao_YYYYMMDD_HHMMSS.dump
```

## Quality checks

```bash
cd backend && bun run lint && bun run build
cd frontend && npm run lint && npm run build
```

Also verify onboarding + role routing, and that no secrets were committed.

## More documentation

- [`CLAUDE.md`](CLAUDE.md) — agent context, gotchas, VPS
- [`backend/README.md`](backend/README.md) — API commands and modules
- [`frontend/README.md`](frontend/README.md) — routes and client notes
- [`frontend/TESTING_GUIDE.md`](frontend/TESTING_GUIDE.md) — manual QA
- [`infra/caddy-ratelimit/README.md`](infra/caddy-ratelimit/README.md) — edge rate limit

## License

Proprietary unless the repository owner states otherwise.

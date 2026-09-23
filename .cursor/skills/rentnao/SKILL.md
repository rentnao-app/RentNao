---
name: rentnao
description: >-
  RentNao monorepo context — local dev (Bun backend, Vite frontend, Docker infra),
  branch workflow (merge/main/plabon/arefin/nihal), VPS deploy, Prisma migrations,
  Caddy edge rate limiting via infra/caddy-ratelimit + SPA Caddy + API Redis RL
  (mholt/caddy-ratelimit), and common errors (ECONNREFUSED proxy, missing
  firebase-admin, Postgres port). Use when working in RentNao, debugging local
  setup, merging branches, deploying, or hardening VPS/Caddy against abuse.
---

# RentNao Project Skill

## What this repo is

Bangladesh rental marketplace: **React/Vite SPA** + **Hono/Bun API** + **Postgres/Redis/MinIO**.

| Area | Path | Stack |
|------|------|-------|
| Frontend | `frontend/` | React 19, Vite 7, Tailwind, react-router, i18n (EN/BN) |
| Backend | `backend/` | Hono, Bun, Prisma, PostgreSQL |
| Infra (local) | `backend/docker-compose.yml` | Postgres 5432, Redis 6379, MinIO 9000/9001 |
| CI/CD | `.github/workflows/deploy.yml` | Build GHCR images on `main` push; SSH deploy to VPS |

**Roles:** TENANT, OWNER, ADMIN — guarded routes in `frontend/src/App.jsx` via `ProtectedRoute`.

## Local development (correct commands)

Root `README.md` mentions `.env.service` and `docker-compose.service.yml` — **those files are not in this repo**. Use `backend/docker-compose.yml` instead.

### 1. Start infra

```bash
cd backend
docker compose up -d
docker ps   # rentnao-postgres, rentnao-redis, rentnao-minio
```

Postgres: `user` / `password` / `rentnao`. Host port is **`5433:5432`** in
`backend/docker-compose.yml` so it does not clash with a Windows Postgres on 5432.

### 2. Backend

```bash
cd backend
bun install          # required after pulls (e.g. firebase-admin)
cp .env.example .env   # once
bun run db:push        # or: bunx prisma migrate deploy
bun run dev            # http://localhost:3000, docs at /docs
```

`backend/.env` must match Docker (local):

```env
DATABASE_URL="postgresql://user:password@127.0.0.1:5433/rentnao?schema=public"
```

Optional (app still runs without them):
- `FIREBASE_*` — FCM push (warns if missing)
- `KYC_BD_API_KEY` — kyc.bd auto-verify
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google login

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev   # http://localhost:5173
```

Vite proxies `/auth`, `/properties`, `/notifications`, etc. to `http://localhost:3000`.  
**`[vite] http proxy error` + `ECONNREFUSED`** = backend not running or crashed (usually Postgres down).

### Health check

- Backend: http://localhost:3000/health (database should be connected)
- Frontend needs backend for listings, notifications, wishlist, testimonials

## Git branch workflow

| Branch | Purpose |
|--------|---------|
| `main` | Production deploy target (CI on push) |
| `merge` | Integration branch — merge `plabon`, `arefin`, `nihal` here first |
| `plabon` | Frontend / i18n / homepage / UI polish |
| `arefin` | Backend features (deals, chat, FCM, KYC, OAuth refactor) |
| `nihal` | Smaller fixes (e.g. copyright/i18n) |

Typical flow: feature branches → `merge` → test locally → PR/merge to `main` → deploy.

Compare branches:

```bash
git fetch origin
git log --oneline origin/merge..origin/plabon
git diff --stat origin/main origin/merge
```

## Backend modules (API prefixes)

Registered in `backend/src/index.ts`:

| Prefix | Module |
|--------|--------|
| `/health` | Health check |
| `/auth` | Login, OAuth, OTP, password |
| `/users` | Profiles, verification, KYC |
| `/properties` | Listings, unlock, search |
| `/wallet` | Balance, topup, fees |
| `/wishlists` | Tenant wishlist |
| `/requests` | Rental requests |
| `/notifications` | In-app + FCM push + admin broadcast |
| `/testimonials` | Reviews |
| `/conversations` | Owner–tenant chat + WebSocket `/ws` |
| `/deals` | Rent deed PDF generation |
| `/admin` | Admin dashboard API |

OpenAPI: http://localhost:3000/docs

## Frontend feature map (key routes)

| Route | Feature |
|-------|---------|
| `/` | Home (Figma-style sections, AOS) |
| `/listings`, `/browse` | Browse + polished `ListingCard` |
| `/listings/:id` | Details, unlock, chat link, map |
| `/owner-dashboard/create-listing` | Create listing + **GPS MapPicker** |
| `/chats`, `/chats/:id` | Messaging (after unlock) |
| `/terms`, `/privacy`, `/cookies`, `/contact` | Static legal pages (`StaticPageShell`) |
| `/admin-dashboard` | KYC, users, listings, fees |
| `/dev/arefin-test` | Dev-only rent deed test (remove before prod) |

i18n: `frontend/src/lib/i18n/` — toggle EN/BN in header.

## Production (VPS)

Deploy workflow SSHs to VPS, runs `docker compose pull && up` in `VPS_APP_DIR` (GitHub secret).

Known VPS layout (Hostinger):
- App compose: `/home/rentnao_admin/opt/rentnao/app/docker-compose.yml`
- Infra compose: `/home/rentnao_admin/opt/rentnao/infra/docker-compose.yml`
- Root `docker-compose.app.yml` / root `Caddyfile` were **removed from this app repo**
  (moved to VPS infra). Do not expect them in the monorepo.
- Postgres often on **5433** on VPS (same host port as local Docker mapping)

After backend deploy with new migrations:

```bash
cd /home/rentnao_admin/opt/rentnao/app
docker compose exec backend bunx prisma migrate deploy
docker compose restart backend
```

Common deploy failure: **port 80 already in use** (Caddy) — not a code bug; free port 80 on VPS.

Site: https://rentnao.co — API: https://api.rentnao.co

## Edge rate limiting (implemented)

**Why:** Abuse burned ~5TB VPS bandwidth. Reject floods at HTTP edge before origin.

### What shipped

| Piece | Path | Role |
|-------|------|------|
| Custom Caddy image | `infra/caddy-ratelimit/Dockerfile` | xcaddy + mholt → `rentnao-caddy:2.10-ratelimit` |
| Local harness | `infra/caddy-ratelimit/docker-compose.test.yml` | Demo `2/5s` on host `:18080` |
| Prod Caddyfile draft | `infra/caddy-ratelimit/Caddyfile.production.example` | Merge into VPS infra Caddy |
| SPA Caddy | `frontend/Dockerfile` + `Caddyfile` | Same module; soft `300/min` per IP |
| API defense-in-depth | `backend/src/middlewares/ip-rate-limit.ts` | Redis: `/auth` 40/min, `/properties` 120/min (fail-open) |

**Verified locally:** Caddy harness `200→200→429` + `Retry-After`; `/health` exempt; backend auth burst → `429`; `/health` + listings still `200`.

**Still required for full edge protection:** deploy `infra/caddy-ratelimit` onto VPS infra Caddy. Until then, SPA/API limits help after traffic already reaches app containers.

Gitignored tests: `_research/caddy-rate-limit/harness/`. Module: **mholt only**.

```bash
cd infra/caddy-ratelimit
docker compose -f docker-compose.test.yml up -d --build
powershell -File _research/caddy-rate-limit/harness/test-caddy-ratelimit.ps1
```

VPS: backup → build image → point infra compose → merge production example → smoke login/OAuth/ws/health. See [reference.md](reference.md#edge-rate-limiting-research).

## Common errors

| Symptom | Cause | Fix |
|---------|-------|-----|
| `couldn't find env file: .env.service` | File not in repo | Use `cd backend && docker compose up -d` |
| `connect ECONNREFUSED 127.0.0.1:5433` | Postgres container down | `cd backend && docker compose up -d` |
| `password authentication failed` on 5432 | Hit Windows Postgres, not Docker | Use host port **5433** (`DATABASE_URL` + compose map) |
| `Cannot find module 'firebase-admin'` | Deps not installed | `cd backend && bun install` |
| `[vite] http proxy error` ECONNREFUSED | Backend down | Fix Postgres + restart `bun run dev` |
| `Database operation failed` (prod) | Missing migrations | `prisma migrate deploy` on VPS |
| Google Maps CORS `gen_204` in console | Browser blocking Google telemetry | Harmless; map still works |

## Merge conflict hotspots

When merging `plabon` into `merge`, expect conflicts in:
- `ListingCard.jsx`, `SiteFooter.jsx`, `TermsPage.jsx`, `ListingPage.jsx`
- `frontend/src/lib/i18n/translations/en.js`, `bn.js`, `en/static.js`, `bn/static.js`
- `App.jsx`

Strategy: keep plabon UI polish + merge/HEAD i18n keys and functional features (chat, mapPicker, filters).

## Quality checks before merge to main

```bash
cd backend && bun run dev   # starts clean
cd frontend && npm run build
```

Run `prisma migrate deploy` on VPS after schema changes.

## More detail

See [reference.md](reference.md) for migrations list, env vars, and team branch tips.

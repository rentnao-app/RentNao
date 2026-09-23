# RentNao — Claude context

Bangladesh rental marketplace. Monorepo: **React/Vite SPA** + **Hono/Bun API** + local **Postgres/Redis/MinIO**.

Read this file before changing code. Prefer existing modules over new frameworks. Do not invent files that are not in the tree.

## Repo truth (easy to get wrong)

These are **not** in this git repo (they live on the VPS only):

- `docker-compose.app.yml`, `docker-compose.service.yml`
- root `Caddyfile`, `.env.service`, `.env.app`

Local infra is **`backend/docker-compose.yml`**. Production compose is on the VPS:

- App: `/home/rentnao_admin/opt/rentnao/app` (backend, frontend, Caddy)
- Infra: `/home/rentnao_admin/opt/rentnao/infra` (Postgres, Redis, MinIO)

`docs/` is gitignored. Keep project docs in these markdown files, not under `docs/`.

## Local commands

```bash
# Infra (Postgres host port 5433 → container 5432)
cd backend && docker compose up -d

# API — http://localhost:3000  OpenAPI: /docs
cd backend && bun install && bun run db:push && bun run dev

# SPA — http://localhost:5173  (Vite proxies API paths to :3000)
cd frontend && npm install && npm run dev
```

`DATABASE_URL` locally must use **port 5433**, not 5432:

```env
DATABASE_URL="postgresql://user:password@127.0.0.1:5433/rentnao?schema=public"
```

`backend/.env.example` still shows `:5432` — that hits a host Postgres if one exists. Always use 5433 with Docker.

## Stack

| Area | Path | Notes |
|------|------|-------|
| Frontend | `frontend/` | React 19, Vite 7, Tailwind 3, react-router-dom **7**, i18n EN/BN, AOS, Google Maps (not Leaflet) |
| Backend | `backend/` | Hono + Bun + Prisma. JWT auth. Modules under `backend/src/modules/` |
| Rate limit | `infra/caddy-ratelimit/` | Custom Caddy + Redis IP limits. VPS edge deploy is still manual |
| Deploy | `.github/workflows/deploy.yml` | Builds GHCR images on push to **`main` only**, then SSH `docker compose pull && up` |

Roles: `TENANT`, `OWNER`, `ADMIN`. Guards: `frontend/src/components/ProtectedRoute.jsx`.

## API (no `/api` prefix)

Mounted in `backend/src/index.ts`:

| Prefix | Purpose |
|--------|---------|
| `/health` | Health |
| `/auth` | Login, OTP, Google OAuth, password |
| `/users` | Profile, KYC |
| `/properties` | Listings, search, unlock |
| `/wallet` | Balance, topup, fees |
| `/wishlists` | Tenant wishlist |
| `/requests` | Rental requests |
| `/notifications` | In-app + FCM |
| `/testimonials` | Reviews |
| `/conversations` | Chat REST |
| `/ws` | Chat WebSocket |
| `/deals` | Rent-deed PDF |
| `/admin` | Admin dashboard |

Frontend: `apiFetch('/auth/login', …)` via `frontend/src/lib/api.js`. Dev uses Vite proxy; prod uses `VITE_API_URL=https://api.rentnao.co`.

Redis IP rate limits (fail-open): `/auth` 40/min, `/properties` 120/min.

## Frontend routes (see `frontend/src/App.jsx`)

Public: `/`, `/listings`, `/browse`, `/listings/:id`, `/login`, `/signup`, legal pages (`/about`, `/terms`, `/privacy`, `/cookies`, `/contact`, `/faq`, `/careers`, `/blogs`, `/services`, `/review`).

Auth: `/chats`, `/chats/:conversationId` (not `/chat`). Dashboards under `/tenant-dashboard`, `/owner-dashboard`, `/admin-dashboard`. Dev-only: `/dev/arefin-test`.

Maps: `VITE_GOOGLE_MAPS_API_KEY` (Maps JavaScript API). Baked in at **frontend Docker build** time. GitHub secret name: `VITE_GOOGLE_MAPS_API_KEY`.

## Git / deploy

| Branch | Role |
|--------|------|
| `main` | Production. CI deploys only from here |
| `merge` | Integration. Merge feature branches here first |
| `plabon` | Frontend / homepage / i18n |
| `arefin` | Backend (deals, chat, FCM, KYC) |
| `nihal` | Smaller UI/footer fixes |

Work on `merge` does **not** reach production until it is in `main`.

After schema changes on prod:

```bash
cd /home/rentnao_admin/opt/rentnao/app
docker compose exec backend bunx prisma migrate deploy
docker compose restart backend
```

## Production incidents (known)

- **~5 TB outbound** (Aug 2026): public `cdn.rentnao.co` → MinIO. HostTier throttled the VPS (241% bandwidth). Edge Caddy rate-limit is the intended fix (`infra/caddy-ratelimit`).
- **API 502 while backend health is 200**: Caddy HTTPS/DNS inside the Caddy container (`127.0.0.53` refused). Backend can be fine.
- **Old homepage on live site**: frontend image not rebuilt/pulled (stale `:latest`). Manual Actions “Build and Deploy” or `docker compose pull` after network is healthy.
- Maps “Oops! Something went wrong”: invalid/missing `VITE_GOOGLE_MAPS_API_KEY` in the **built** bundle, not a React bug.

## Coding conventions

- Match existing file style. Do not add new libraries without a clear need.
- Backend: Zod OpenAPI schemas next to routes; keep SQL/Prisma column names `snake_case`, API JSON `camelCase`.
- Frontend: i18n keys in `frontend/src/lib/i18n/translations/{en,bn}/`. Add both languages.
- Property amenity booleans follow `has_lift` / `hasGarage` / `has_gas` pattern (schema + migration + service map + create/edit/details + i18n).
- Never commit `.env`, secrets, or `_research/`.

## More docs

- Human overview: `README.md`
- API setup: `backend/README.md`
- SPA routes: `frontend/README.md`
- Manual QA: `frontend/TESTING_GUIDE.md`
- Cursor skill (same facts, more VPS/RL detail): `.cursor/skills/rentnao/`

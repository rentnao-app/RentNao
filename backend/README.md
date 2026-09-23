# RentNao backend

Hono + Bun + Prisma API for the Bangladesh rental marketplace.

Agent context: [`../CLAUDE.md`](../CLAUDE.md). OpenAPI: http://localhost:3000/docs after `bun run dev`.

## Quick start

### Prerequisites

[Bun](https://bun.sh) and [Docker](https://www.docker.com/products/docker-desktop).

```bash
# macOS
brew install oven-sh/bun/bun
brew install --cask docker

# Ubuntu/Debian
curl -fsSL https://bun.sh/install | bash
sudo apt-get install docker.io docker-compose-v2
```

### Run

From **`backend/`**:

```bash
docker compose up -d          # Postgres, Redis, MinIO
bun install
cp .env.example .env          # then fix DATABASE_URL port — see below
bun run db:push               # or: bunx prisma migrate deploy
bun run dev
```

- API: http://localhost:3000
- Docs: http://localhost:3000/docs
- Health: http://localhost:3000/health

## Docker services (`backend/docker-compose.yml`)

| Service | Host port | Credentials |
|---------|-----------|-------------|
| PostgreSQL 16 | **5433** → 5432 | `user` / `password` / db `rentnao` |
| Redis 7 | 6379 | none |
| MinIO | 9000 (S3), 9001 (console) | `minioadmin` / `minioadmin` |

**Use host port 5433 in `DATABASE_URL`.** Port 5432 is often a different Postgres on the host and will fail with `password authentication failed`.

```env
DATABASE_URL="postgresql://user:password@127.0.0.1:5433/rentnao?schema=public"
```

`.env.example` still shows `:5432` — override it.

```bash
docker compose up -d
docker compose logs -f postgres
docker compose down            # keep volumes
docker compose down -v         # wipe data
```

MinIO console: http://localhost:9001

## Environment

Copy `.env.example` → `.env`. Essential:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres (**5433** locally) |
| `JWT_SECRET` | Auth tokens |
| `REDIS_HOST` / `REDIS_PORT` | Cache, sessions, IP rate limit |
| `S3_INTERNAL_ENDPOINT` | Backend → MinIO (`http://localhost:9000`) |
| `S3_PUBLIC_ENDPOINT` | Browser URLs (prod: `https://cdn.rentnao.co`) |
| `CORS_ORIGIN` | Comma-separated SPA origins |

Optional: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `PUBLIC_API_ORIGIN`, `FIREBASE_*` (FCM), SMS OTP (`SMS_OTP_*`, `BULKSMSBD_*`).

IP rate limits (Redis, fail-open if Redis is down): `/auth` 40/min, `/properties` 120/min. See `src/middlewares/ip-rate-limit.ts`.

## Commands

```bash
bun run dev              # watch server
bun run start            # production
bun run build            # bundle
bun run db:push          # sync schema (dev)
bun run db:migrate       # create/apply migrations
bun run db:generate      # Prisma client
bun run db:studio        # Prisma Studio
bun run lint
bun run format
```

After editing `prisma/schema.prisma`:

```bash
bun run db:migrate
```

On production, prefer `bunx prisma migrate deploy` inside the backend container.

## Modules (mounted in `src/index.ts`)

| Prefix | Module |
|--------|--------|
| `/health` | Health |
| `/auth` | Login, OTP, Google OAuth, password |
| `/users` | Profiles, KYC |
| `/properties` | Listings, search, unlock |
| `/wallet` | Balance, topup, fees |
| `/wishlists` | Tenant wishlist |
| `/requests` | Rental requests |
| `/notifications` | In-app + FCM + admin broadcast |
| `/testimonials` | Reviews |
| `/conversations` | Chat REST |
| `/ws` | Chat WebSocket |
| `/deals` | Rent-deed PDF |
| `/admin` | Admin dashboard |

There is **no `/api` prefix**. Frontend calls `apiFetch('/auth/login', …)`.

## Project structure

```text
src/
├── index.ts                 # App entry, CORS, rate limits, route mount
├── config/                  # env, OpenAPI
├── db/                      # Postgres, Redis, S3
├── errors/
├── middlewares/             # error-handler, ip-rate-limit
├── modules/                 # domain modules (auth, users, properties, …)
├── jobs/                    # cron (conversation expiry, …)
└── utils/
prisma/
├── schema.prisma
└── migrations/
scripts/                     # seeds and one-off admin scripts
docker-compose.yml           # local infra only
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `connect ECONNREFUSED 127.0.0.1:5433` | `docker compose up -d` |
| `password authentication failed` on 5432 | You hit host Postgres. Use **5433** |
| `Cannot find module 'firebase-admin'` | `bun install` |
| Port 3000 in use | `lsof -ti:3000 \| xargs kill -9` |
| Prod `column … does not exist` | `bunx prisma migrate deploy` on the VPS |

## Production

Images: `ghcr.io/rentnao-app/rentnao-backend`. Deployed from `main` via GitHub Actions. VPS app dir: `/home/rentnao_admin/opt/rentnao/app`.

---

Built with [Hono](https://hono.dev), [Bun](https://bun.sh), and [Prisma](https://www.prisma.io).

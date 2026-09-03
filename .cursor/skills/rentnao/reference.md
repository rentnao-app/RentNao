# RentNao Reference

## Repository layout

```text
RentNao/
├── .cursor/skills/rentnao/     # This skill
├── .github/workflows/deploy.yml
├── backend/
│   ├── docker-compose.yml      # LOCAL infra (Postgres/Redis/MinIO) — use this
│   ├── prisma/migrations/      # Apply with migrate deploy in prod
│   ├── src/modules/            # Domain modules
│   └── scripts/                # seed-test-deal, test-admin-broadcast, etc.
├── frontend/
│   ├── src/pages/              # Route pages
│   ├── src/components/         # Shared UI
│   └── src/lib/i18n/           # EN/BN translations
├── scripts/db-backup.sh        # Postgres backup (expects .env.service — may need adapt)
└── README.md                   # Note: references some root compose files not present in repo
```

## Recent backend migrations (merge branch)

- `20260724112021_add_parents_names`
- `20260730183055_add_kyc_verification_fields`
- `20260805150000_push_subscriptions`
- Property amenities: `20260725010000_property_amenities_nearby`, `20260725020000_property_has_gas`

## Environment variables

### backend/.env (essential)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres — host **5433** locally (Docker map) and often **5433** on VPS; container internal is 5432 |
| `JWT_SECRET` | Auth tokens |
| `REDIS_HOST`, `REDIS_PORT` | Sessions/cache |
| `S3_*` | MinIO locally; S3 in prod |
| `CORS_ORIGIN` | Include `http://localhost:5173` |

### backend/.env (optional features)

| Variable | Feature |
|----------|---------|
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Push notifications |
| `KYC_BD_API_KEY`, `KYC_BD_BASE_URL` | kyc.bd verification |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `PUBLIC_API_ORIGIN` | Google OAuth |

### frontend/.env

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | `http://localhost:3000` |
| `VITE_GOOGLE_AUTH_URL` | `http://localhost:3000/auth/google` |
| `VITE_GOOGLE_MAPS_API_KEY` | MapPicker / MapView |

## Feature ownership by branch (historical)

| Feature | Branch |
|---------|--------|
| Homepage Figma redesign, AOS | plabon |
| EN/BN i18n, language toggle | plabon |
| ListingCard polish, footer legal pages | plabon |
| Owner–tenant chat UI | arefin |
| Rent deed PDF + deals API | arefin |
| FCM + admin broadcast | arefin |
| kyc.bd integration | arefin |
| Parent names on rent deed | arefin |
| GPS MapPicker on create listing | merge (earlier) |
| Property amenities (has_gas, nearby_*) | merge/main |

## VPS SSH (production)

```bash
ssh rentnao_admin@103.187.23.17
cd /home/rentnao_admin/opt/rentnao/app
docker compose ps
docker compose exec backend bunx prisma migrate deploy
```

## Node version note

Vite 7 wants Node `^20.19.0 || >=22.12.0`. Node 22.11 works but shows EBADENGINE warnings.

## npm audit (frontend)

`brace-expansion` vulnerability is in ESLint devDependencies only. Override in `frontend/package.json` can pin `5.0.9` if needed — does not affect runtime.

## Edge rate limiting (research)

**Status:** **implemented in-repo** (Caddy package + SPA image + API Redis RL). VPS infra edge deploy still manual. Trigger: ~5TB bandwidth burn.

**Local clones (gitignored):** `_research/caddy-rate-limit/`
- `mholt-caddy-ratelimit/` ← [mholt/caddy-ratelimit](https://github.com/mholt/caddy-ratelimit) (**chosen**)
- `russelluo-caddy-ext/` ← [RussellLuo/caddy-ext](https://github.com/RussellLuo/caddy-ext) (educational)

**Video:** [Master Caddy Rate Limiting in Docker | ep 10](https://youtu.be/D85dqp1bcGE) — pattern below matches the screenshots.

### Architecture fit

```text
Internet
   → VPS edge Caddy (infra; TLS for rentnao.co + api.rentnao.co)  ← PUT RL HERE (primary)
        → frontend container (caddy:2-alpine + SPA)              ← optional later
        → backend container (Hono/Bun :3000)                     ← OTP/WS limits only today
        → Postgres / Redis / MinIO
```

| Layer | What exists today | Stops bandwidth waste? |
|-------|-------------------|------------------------|
| VPS infra Caddy | Reverse proxy under `opt/rentnao/infra` (not in this repo) | **Only if RL added here** |
| `frontend` Caddy | Stock `caddy:2-alpine`, SPA `file_server` | No module until custom build |
| Backend OTP | Redis: 1 OTP / 120s per user | No — request already paid bandwidth |
| Backend chat WS | In-memory sliding window | No — WS already connected |
| Backend login/API | No general HTTP rate limit | No |

### Repo comparison (from local clones)

| | **mholt** (`_research/.../mholt-caddy-ratelimit`) | **RussellLuo** (`.../russelluo-caddy-ext/ratelimit`) |
|--|--|--|
| Caddy version in `go.mod` | **v2.10.0** (current) | **v2.4.5** (old) |
| Algorithm | Sliding window + ring buffer | Sliding window + LRU zone |
| Caddyfile | Zone blocks: `events` + `window` | One-liner: `rate_limit {key} 10r/m` |
| On exceed | HTTP **429** + **`Retry-After`** (proven in video) | 429 (configurable status) |
| Distributed / cluster | Yes | No |
| IPv6 prefix grouping | `ipv6_prefix` | `{remote.ip_prefix.N}` keys |
| Directive name | `rate_limit` | `rate_limit` ← **conflict if both built in** |

**Decision:** implement with **mholt only** (same module the video builds). Keep RussellLuo clone for syntax contrast only.

### Video recipe → RentNao mapping

What the video does (exact pattern from screenshots):

1. **Dockerfile (xcaddy multi-stage)**
   ```dockerfile
   FROM caddy:builder-alpine AS builder
   RUN xcaddy build \
       --with github.com/mholt/caddy-ratelimit

   FROM caddy:2.8.4
   COPY --from=builder /usr/bin/caddy /usr/bin/caddy
   ```
2. **Build tag:** `docker build -t caddy:2.8.4-ratelimit .`
3. **Compose:** Caddy service uses `image: caddy:2.8.4-ratelimit`, mounts `./Caddyfile`, `./data`, `./config`, publishes `80`/`443`.
4. **Caddyfile zone (demo — intentionally harsh):**
   ```caddyfile
   rate_limit {
     zone dynamic_zone {
       key {http.request.remote_ip}
       events 2
       window 5s
     }
   }
   ```
5. **Proof:** 1st–2nd `curl` → `200`; 3rd → `429 Too Many Requests` + `Retry-After: N`.

For RentNao we reuse this **build + image + zone** pattern, but:
- Pin Caddy base tag to whatever the VPS already runs (may not be `2.8.4` — discover first).
- Prefer official placeholders from mholt README: `{remote_host}` / `{http.request.remote.host}` (video’s `{http.request.remote_ip}` works if that placeholder resolves on the built version; verify with `caddy adapt` / live test).
- Use **production-safe** `events`/`window` (demo `2 / 5s` would break normal SPA browsing).
- Apply on **infra edge**, not only the SPA container.

---

## Implementation plan (executed in-repo; VPS edge still pending)

### Goals

1. Cut abusive scrape / brute-force / flood bandwidth at the edge.
2. Zero intentional breakage of login, OAuth, listings, chat WS, admin, health checks.
3. Rollback path: swap image/tag or remove `rate_limit` block and reload.

### Non-goals (first pass)

- Changing Hono/React application code for edge RL.
- Cloudflare/CDN.
- Distributed multi-node RL (single VPS → in-memory is enough).
- Replacing existing OTP / WS app limits (keep them).

### Phase 0 — Discover live edge (required before any file change)

SSH to VPS and capture (read-only):

```bash
ssh rentnao_admin@103.187.23.17
cd /home/rentnao_admin/opt/rentnao/infra   # confirm path
docker compose ps
docker compose images | grep -i caddy
# locate Caddyfile (compose volume mount)
docker exec <caddy_container> caddy version
docker exec <caddy_container> cat /etc/caddy/Caddyfile
```

Record: image tag, site blocks for `rentnao.co` / `api.rentnao.co`, whether TLS is on this Caddy, upstream names for frontend/backend, any existing `trusted_proxies` / `client_ip`.

**Stop if unclear** — wrong target = risk of breaking production TLS/routing.

### Phase 1 — Add infra artifacts (where they belong)

Prefer **VPS infra tree** (or a future infra repo), not the SPA `frontend/Caddyfile` alone.

Suggested layout on infra (or staged PR folder later):

```text
infra/caddy/   # or opt/rentnao/infra/caddy/
  Dockerfile           # video multi-stage + mholt module
  docker-compose.yml   # or patch existing compose: image → custom tag
  Caddyfile            # existing hosts + rate_limit zones
```

**Optional later in app monorepo:** mirror templates under something like `infra/caddy-ratelimit/` for version control — only after Phase 0 confirms paths. Do **not** replace `frontend`’s stock Caddy as the *only* defense (that container is behind the edge and does not terminate public TLS for the API).

### Phase 2 — Custom image (video step)

```bash
# on build host / VPS / CI
docker build -t caddy:<existing-version>-ratelimit -f Dockerfile .
# smoke: binary contains module
docker run --rm caddy:<existing-version>-ratelimit caddy list-modules | grep rate_limit
```

Pin builder + runtime tags to the **same major/minor** as production Caddy to avoid surprise TLS/Caddyfile incompatibilities. Rebuild when upgrading Caddy.

### Phase 3 — Caddyfile zones (safe defaults)

Apply `rate_limit` **before** `reverse_proxy` / static handlers (mholt registers order before `basic_auth`; use `route { }` if order fights existing config).

Draft production zones (tune after log baseline — **not** video’s 2/5s):

| Zone | Key | Match | Draft limit | Purpose |
|------|-----|-------|-------------|---------|
| `site_ip` | `{remote_host}` + `ipv6_prefix 64` | `rentnao.co` | ~120–300 / 1m | Soft SPA/scrape ceiling |
| `api_ip` | same | `api.rentnao.co` | ~60–120 / 1m | API scrape ceiling |
| `auth_strict` | same | path `/auth/*` | ~20–40 / 1m | Brute-force / OTP flood |
| (exclude) | — | `/health` | unlimited via separate `handle` **before** RL or no match | Uptime monitors |
| (careful) | — | `/ws` | exclude or dedicated generous zone | Chat WebSocket upgrade |

Enable `log_key` while tuning; disable if keys are sensitive in shared logs.

Illustrative API block (not live):

```caddyfile
api.rentnao.co {
	handle /health {
		reverse_proxy backend:3000
	}

	handle {
		rate_limit {
			zone api_ip {
				key         {remote_host}
				events      90
				window      1m
				ipv6_prefix 64
			}
			zone auth_strict {
				match {
					path /auth/*
				}
				key         {remote_host}
				events      30
				window      1m
				ipv6_prefix 64
			}
			log_key
		}
		reverse_proxy backend:3000
	}
}
```

**Client IP rule:** if Caddy is the public edge, `{remote_host}` is correct. If anything sits in front (CDN), configure Caddy `trusted_proxies` / `client_ip` and key on the real client IP — never blindly trust raw `X-Forwarded-For` from the internet.

### Phase 4 — Staged rollout (must not break prod)

1. **Off-hours** or low traffic window.
2. Backup current Caddyfile + note current image digest.
3. Deploy custom image with **generous** limits first (or even `events` high enough that only clear abuse trips).
4. `caddy validate --config ...` / compose up; confirm sites still resolve HTTPS.
5. **Functional smoke (must all pass):**
   - `https://rentnao.co` homepage + static assets
   - Browse listings / property detail
   - Login + Google OAuth callback
   - OTP / password reset (should still work under normal use)
   - Chat WebSocket (`/ws`) send/receive
   - Admin dashboard
   - `https://api.rentnao.co/health` → 200
6. **Abuse smoke:** rapid `curl` loop to `/auth/...` and public API → expect `429` + `Retry-After` (same as video).
7. Watch 24–48h: bandwidth, 429 rate, false positives (shared NAT / mobile carriers).
8. Tighten `auth_strict` then `api_ip`; leave SPA more permissive.

### Phase 5 — Rollback

```bash
# restore previous image tag in compose + previous Caddyfile
docker compose up -d
# or: remove rate_limit { } blocks and reload
```

Keep previous image tagged locally until stable for ≥1 week.

### Phase 6 — Docs after go-live

Update this file with **real** zone numbers, image tag, and Caddyfile path. Mark status **implemented**.

### Breakage risks & mitigations

| Risk | Mitigation |
|------|------------|
| SPA loads many chunks → false 429 | Higher `site_ip` events; limit API/auth tighter than static |
| WebSocket broken | `handle /ws` outside RL or generous zone |
| OAuth callback blocked | Don’t set auth limits below normal redirect bursts; test Google login |
| Shared office/carrier NAT | Start soft; use prefix grouping carefully; monitor complaints |
| Wrong Caddy version / module missing | `list-modules` check; pin tags; validate config before up |
| Only changing `frontend/Dockerfile` | Incomplete — API traffic bypasses SPA Caddy |

### Compatibility with RentNao app code

- **No backend/frontend source changes required** for first pass.
- Existing OTP Redis + WS limits stay as defense-in-depth.
- CI `deploy.yml` may later build/push custom Caddy image — optional; VPS local build is enough for first ship.
- Do not commit `_research/` (already in root `.gitignore`).

### Ready criteria before coding

- [ ] Phase 0 discovery notes captured (image, Caddyfile, hosts)
- [ ] User explicitly approves implementation
- [ ] Agreed first-pass zone numbers (or “start generous”)
- [ ] Rollback owner + window agreed


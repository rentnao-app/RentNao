# RentNao edge Caddy + rate limiting

Custom Caddy image with [`mholt/caddy-ratelimit`](https://github.com/mholt/caddy-ratelimit) for DDoS / scrape / brute-force mitigation at the HTTP edge.

## Why here

Public traffic hits **VPS infra Caddy** first (`opt/rentnao/infra`), then `frontend` / `backend`. App-level OTP/WS limits do not stop bandwidth burn. This package is the edge control plane.

## Files

| File | Purpose |
|------|---------|
| `Dockerfile` | xcaddy build with mholt module → `rentnao-caddy:2.10-ratelimit` |
| `Caddyfile.test` | Harsh demo limits (2 events / 5s) for local proof |
| `Caddyfile.production.example` | Safer zone drafts for `rentnao.co` / `api.rentnao.co` |
| `docker-compose.test.yml` | Local harness on host port **18080** |

## Local verify

```bash
cd infra/caddy-ratelimit
docker compose -f docker-compose.test.yml up -d --build
docker run --rm rentnao-caddy:2.10-ratelimit caddy list-modules | grep rate_limit
# Run gitignored harness scripts under _research/caddy-rate-limit/harness/
```

Expect: first two requests `200`, third `429` + `Retry-After` (demo Caddyfile).

## VPS deploy (manual — after backup)

1. SSH and back up live Caddyfile + note current image.
2. Copy this folder to the infra host (or build on the VPS).
3. `docker build -t rentnao-caddy:2.10-ratelimit .`
4. Point infra compose Caddy service at that image.
5. Merge zones from `Caddyfile.production.example` into the live Caddyfile (preserve existing TLS/email/upstreams).
6. `docker compose up -d` then smoke homepage, login, OAuth, `/ws`, `/health`.
7. Abuse-test API/auth; tighten zones after 24–48h.

Rollback: restore previous image tag + Caddyfile.

## Module choice

**mholt only** — do not also install RussellLuo `caddy-ext/ratelimit` (same directive name).

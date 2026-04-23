# bKash Sandbox Simulation Server

This is a local simulator for bKash Checkout API `v1.2.0-beta` sandbox endpoints. It is designed for development and QA environments where you need deterministic payment responses without calling real bKash services.

## Features

- Grant token
- Refresh token
- Create payment
- Execute payment
- Query payment
- Void payment
- In-memory state (no database required)

## Tech Stack

- Node.js
- Express

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy environment variables:

   ```bash
   cp .env.example .env
   ```

3. Start server:

   ```bash
   npm run dev
   ```

Server runs at `http://localhost:8080` by default.

## Authentication

Grant token endpoint:

```http
POST /v1.2.0-beta/checkout/token/grant
Content-Type: application/json
username: sandbox-username
password: sandbox-password
```

Body:

```json
{
  "app_key": "sandbox-app-key",
   "app_secret": "sandbox-app-secret"
}
```

Use returned `id_token` in headers for protected endpoints:

```http
Authorization: Bearer <id_token>
X-APP-Key: sandbox-app-key
```

## Simulated Endpoints

- `POST /v1.2.0-beta/checkout/token/grant`
- `POST /v1.2.0-beta/checkout/token/refresh`
- `POST /v1.2.0-beta/checkout/payment/create`
- `POST /v1.2.0-beta/checkout/payment/execute/{paymentID}`
- `GET /v1.2.0-beta/checkout/payment/query/{paymentID}`
- `POST /v1.2.0-beta/checkout/payment/void/{paymentID}`
- `GET /health`

Root aliases without `/v1.2.0-beta` are also available for local testing.

## Quick Flow Example

```bash
# 1) Grant token
TOKEN=$(curl -s -X POST http://localhost:8080/v1.2.0-beta/checkout/token/grant \
   -H 'content-type: application/json' \
   -H 'username: sandbox-username' \
   -H 'password: sandbox-password' \
   -d '{"app_key":"sandbox-app-key","app_secret":"sandbox-app-secret"}' \
   | node -e 'const fs=require("fs");process.stdout.write(JSON.parse(fs.readFileSync(0,"utf8")).id_token)')

# 2) Create payment
CREATED=$(curl -s -X POST http://localhost:8080/v1.2.0-beta/checkout/payment/create \
   -H "authorization: Bearer $TOKEN" \
   -H 'X-APP-Key: sandbox-app-key' \
   -H 'content-type: application/json' \
   -d '{"amount":"100","currency":"BDT","intent":"sale","merchantInvoiceNumber":"INV-1001"}')

PAYMENT_ID=$(printf '%s' "$CREATED" | node -e 'const fs=require("fs");process.stdout.write(JSON.parse(fs.readFileSync(0,"utf8")).paymentID)')

# 3) Execute payment
curl -s -X POST "http://localhost:8080/v1.2.0-beta/checkout/payment/execute/$PAYMENT_ID" \
   -H "authorization: Bearer $TOKEN" \
   -H 'X-APP-Key: sandbox-app-key'

# 4) Query payment
curl -s "http://localhost:8080/v1.2.0-beta/checkout/payment/query/$PAYMENT_ID" \
   -H "authorization: Bearer $TOKEN" \
   -H 'X-APP-Key: sandbox-app-key'
```

## Notes

- Data is stored in memory and resets on server restart.
- Status and response fields mimic a simplified bKash flow for integration testing.

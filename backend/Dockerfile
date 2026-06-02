FROM oven/bun:1.3.11 AS deps
WORKDIR /app


COPY package.json bun.lockb* bun.lock* ./

COPY prisma ./prisma 

RUN bun install --frozen-lockfile

FROM deps AS builder
COPY . .

RUN bun build src/index.ts --outdir ./dist --target bun

FROM deps AS deps-prod
RUN bun install --production --frozen-lockfile

# 4. Final lightweight runtime
FROM oven/bun:1.3.11-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
USER bun

COPY --from=builder /app/dist ./dist
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["bun", "./dist/index.js"]
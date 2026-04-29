FROM oven/bun:latest AS deps
WORKDIR /app

COPY package.json package-lock.json* bun.lockb* tsconfig.json ./
COPY prisma ./prisma

RUN --mount=type=cache,target=/root/.bun \
	bun install

FROM deps AS builder
COPY . .
RUN bun build src/index.ts --outdir ./dist --target bun

FROM deps AS deps-prod
RUN --mount=type=cache,target=/root/.bun \
	bun install --production

FROM oven/bun:latest AS runtime
WORKDIR /app
ENV NODE_ENV=development

COPY --from=builder /app/dist ./dist
COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["bun", "./dist/index.js"]

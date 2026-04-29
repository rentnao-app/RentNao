FROM oven/bun:latest AS builder
WORKDIR /app

COPY package.json package-lock.json* bun.lockb* tsconfig.json ./
COPY prisma ./prisma

COPY . .

RUN --mount=type=cache,target=/root/.bun \
	bun install

RUN bun build src/index.ts --outdir ./dist --target bun

RUN --mount=type=cache,target=/root/.bun \
	bun install --production


FROM oven/bun:latest AS runtime
WORKDIR /app
ENV NODE_ENV=development

# Prisma CLI is needed for `bunx prisma migrate deploy` at container startup.
RUN bun add -g prisma

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["bun", "./dist/index.js"]

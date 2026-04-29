FROM oven/bun:latest AS builder
WORKDIR /app

COPY package.json package-lock.json* bun.lockb* tsconfig.json ./
COPY prisma ./prisma

COPY . .

RUN bun install

RUN bun build src/index.ts --outdir ./dist --target bun

RUN bun install --production


FROM oven/bun:latest AS runtime
WORKDIR /app
ENV NODE_ENV=development

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3001

CMD ["bun", "./dist/index.js"]

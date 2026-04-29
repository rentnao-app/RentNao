FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* ./
RUN --mount=type=cache,target=/root/.npm \
	npm ci --silent
COPY . .
RUN npm run build

FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

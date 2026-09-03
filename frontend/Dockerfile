FROM caddy:2.10-builder-alpine AS caddybuilder
RUN xcaddy build \
	--with github.com/mholt/caddy-ratelimit

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* ./
RUN --mount=type=cache,target=/root/.npm \
	npm ci --silent
COPY . .
ARG VITE_API_URL
ARG VITE_GOOGLE_AUTH_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_AUTH_URL=$VITE_GOOGLE_AUTH_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build

FROM caddy:2.10-alpine
COPY --from=caddybuilder /usr/bin/caddy /usr/bin/caddy
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

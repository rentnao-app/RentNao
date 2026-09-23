# Custom Caddy with mholt/caddy-ratelimit (sliding-window HTTP RL).
# Pattern matches: https://youtu.be/D85dqp1bcGE + https://github.com/mholt/caddy-ratelimit
#
# Build:  docker build -t rentnao-caddy:2.10-ratelimit .
# Module: docker run --rm rentnao-caddy:2.10-ratelimit caddy list-modules | findstr rate_limit

FROM caddy:2.10-builder-alpine AS builder

RUN xcaddy build \
    --with github.com/mholt/caddy-ratelimit

FROM caddy:2.10-alpine

COPY --from=builder /usr/bin/caddy /usr/bin/caddy

# Default config is replaced via compose volume or COPY in downstream images.
EXPOSE 80 443
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]

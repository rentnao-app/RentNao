/**
 * Redis sliding-window IP rate limit (defense in depth behind edge Caddy).
 * Does not replace infra/caddy-ratelimit — rejects early to save app/DB work.
 */

import type { Context, Next } from 'hono';
import { redis } from '@/db/redis';

function clientIp(c: Context): string {
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = c.req.header('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown';
}

export type IpRateLimitOptions = {
  /** Redis key prefix, e.g. `rl:auth` */
  prefix: string;
  /** Max requests in the window */
  max: number;
  /** Window length in seconds */
  windowSeconds: number;
};

/**
 * Returns Hono middleware that rate-limits by client IP.
 * If Redis is unavailable, fails open (allows the request) so auth is not bricked.
 */
export function ipRateLimit(options: IpRateLimitOptions) {
  const { prefix, max, windowSeconds } = options;

  return async (c: Context, next: Next) => {
    const ip = clientIp(c);
    const key = `${prefix}:${ip}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, windowSeconds);
      }

      const ttl = await redis.ttl(key);
      const remaining = Math.max(0, max - count);
      c.header('X-RateLimit-Limit', String(max));
      c.header('X-RateLimit-Remaining', String(remaining));
      if (ttl > 0) {
        c.header('X-RateLimit-Reset', String(ttl));
      }

      if (count > max) {
        const retryAfter = ttl > 0 ? ttl : windowSeconds;
        c.header('Retry-After', String(retryAfter));
        return c.json(
          {
            success: false,
            error: 'Too many requests. Please try again later.',
            statusCode: 429,
          },
          429
        );
      }
    } catch (err) {
      console.error('[RateLimit] Redis error — failing open:', {
        message: err instanceof Error ? err.message : String(err),
        prefix,
      });
    }

    await next();
  };
}

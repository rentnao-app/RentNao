/**
 * IP Whitelisting Middleware
 * Validates that webhook requests come from whitelisted IPs
 */

import type { Context, Next } from 'hono';
import { error } from '@/utils/response';
import { getWhitelistedIps } from '../config/bkash';

/**
 * Get client IP from request headers
 * Handles X-Forwarded-For, CF-Connecting-IP, and direct connection
 */
function getClientIp(c: Context): string {
  const forwardedFor = c.req.header('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]!.trim();
  }

  const cloudflareIp = c.req.header('CF-Connecting-IP');
  if (cloudflareIp) {
    return cloudflareIp;
  }

  // Direct connection - this is harder to get from Hono context
  // For now, return a placeholder (production would need server-level access)
  return c.req.header('X-Real-IP') || 'unknown';
}

/**
 * Middleware to validate request IP is whitelisted
 * Used for webhook endpoints that should only accept from bKash
 */
export async function requireWhitelistedIp(c: Context, next: Next) {
  const whitelistedIps = getWhitelistedIps();

  // If no whitelist configured, log warning and allow (development mode)
  if (whitelistedIps.length === 0) {
    console.warn('[Webhook] No IP whitelist configured, allowing all IPs');
    await next();
    return;
  }

  const clientIp = getClientIp(c);

  // Allow localhost in development
  if (process.env.NODE_ENV === 'development' && (clientIp === '127.0.0.1' || clientIp === 'localhost')) {
    await next();
    return;
  }

  // Check if IP is whitelisted (support CIDR blocks later if needed)
  const isWhitelisted = whitelistedIps.includes(clientIp);

  if (!isWhitelisted) {
    console.warn(`[Webhook] Rejected request from non-whitelisted IP: ${clientIp}`);
    return error(c, 'Access denied', 401);
  }

  await next();
}

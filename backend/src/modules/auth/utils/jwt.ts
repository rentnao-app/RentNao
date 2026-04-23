/**
 * JWT token generation and verification utilities
 */

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { verifyAccessToken, type AccessTokenPayload } from '@/security';

export type JwtPayload = AccessTokenPayload;

/**
 * Generate a JWT access token
 */
export function generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'jti'>): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'rentnao-api',
    audience: 'rentnao-client',
    jwtid: crypto.randomUUID(),
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload {
  return verifyAccessToken(token);
}

/**
 * Generate a refresh token (longer lived)
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET as string, {
    expiresIn: '30d',
    issuer: 'rentnao-api',
    audience: 'rentnao-client',
  });
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Calculate remaining token TTL in seconds from JWT payload exp
 */
export function getRemainingTokenTtlSeconds(payload: Pick<JwtPayload, 'exp'>): number {
  if (!payload.exp) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

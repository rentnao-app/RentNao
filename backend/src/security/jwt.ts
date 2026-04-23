import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import type { Principal } from './types/principal';

export type AccessTokenPayload = Principal;

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET as string, {
      issuer: 'rentnao-api',
      audience: 'rentnao-client',
    });
    return decoded as AccessTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

export function generateAccessToken(
  payload: Omit<AccessTokenPayload, 'iat' | 'exp' | 'jti'>
): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'rentnao-api',
    audience: 'rentnao-client',
    jwtid: crypto.randomUUID(),
  });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, env.JWT_SECRET as string, {
    expiresIn: '30d',
    issuer: 'rentnao-api',
    audience: 'rentnao-client',
  });
}

export function getRemainingTokenTtlSeconds(payload: Pick<AccessTokenPayload, 'exp'>): number {
  if (!payload.exp) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
}

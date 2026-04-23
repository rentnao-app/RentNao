import type { Context, Next } from 'hono';
import { error } from '@/utils/response';
import { verifyAccessToken } from '../jwt';
import { isAccessTokenBlacklisted } from '../revocation/access-token';

export async function requireAuth(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader) {
      return error(c, 'Authorization header is required', 401);
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return error(c, 'Invalid Authorization header format. Use: Bearer <token>', 401);
    }

    const token = parts[1]!;
    const payload = verifyAccessToken(token);

    const isBlacklisted = await isAccessTokenBlacklisted(token, payload.jti);
    if (isBlacklisted) {
      return error(c, 'Token has been revoked. Please login again.', 401);
    }

    c.set('user', payload);
    c.set('authToken', token);

    await next();
  } catch (err: any) {
    console.error('Auth middleware error:', err);

    if (err.message.includes('expired')) {
      return error(c, 'Token has expired. Please login again.', 401);
    }

    if (err.message.includes('Invalid')) {
      return error(c, 'Invalid token. Please login again.', 401);
    }

    return error(c, 'Authentication failed', 401);
  }
}

export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      return error(c, 'Authentication required', 401);
    }

    if (!roles.includes(user.role)) {
      return error(c, 'Insufficient permissions', 403);
    }

    await next();
  };
}

export async function requireCompletedOnboarding(c: Context, next: Next) {
  const user = c.get('user');

  if (!user) {
    return error(c, 'Authentication required', 401);
  }

  if (user.onboardingStatus !== 'COMPLETED') {
    return error(c, 'Please complete your profile to access this resource', 403);
  }

  await next();
}

export async function requireProfileComplete(c: Context, next: Next) {
  const user = c.get('user');

  if (!user) {
    return error(c, 'Authentication required', 401);
  }

  if (user.onboardingStatus === 'AUTH_PENDING') {
    return error(c, 'Profile completion required', 403);
  }

  await next();
}

export async function requireKycApproved(c: Context, next: Next) {
  const user = c.get('user');

  if (!user) {
    return error(c, 'Authentication required', 401);
  }

  if (user.onboardingStatus !== 'COMPLETED') {
    return error(c, 'Please complete your profile and verification first', 403);
  }

  if (user.kycVerificationStatus !== 'APPROVED') {
    return error(c, 'KYC verification approval is required for this action', 403);
  }

  await next();
}

export async function optionalAuth(c: Context, next: Next) {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1]!;
        const payload = verifyAccessToken(token);

        const isBlacklisted = await isAccessTokenBlacklisted(token, payload.jti);
        if (!isBlacklisted) {
          c.set('user', payload);
          c.set('authToken', token);
        }
      }
    }
  } catch (err) {
    console.debug('Optional auth failed:', err);
  }

  await next();
}

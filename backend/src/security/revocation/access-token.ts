import crypto from 'crypto';
import { redis } from '@/db/redis';
import { RedisOperationError } from '@/errors';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getAccessTokenBlacklistKey(token: string, jti?: string): string {
  const tokenIdentifier = jti ?? hashToken(token);
  return `blacklist:access:${tokenIdentifier}`;
}

export async function blacklistAccessToken(
  token: string,
  ttlSeconds: number,
  jti?: string
): Promise<void> {
  if (ttlSeconds <= 0) {
    return;
  }

  try {
    const key = getAccessTokenBlacklistKey(token, jti);
    await redis.set(key, '1', 'EX', ttlSeconds);
  } catch (error: any) {
    console.error('[Redis] Failed to blacklist access token:', {
      jti,
      ttlSeconds,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to blacklist access token: ${error.message}`);
  }
}

export async function isAccessTokenBlacklisted(
  token: string,
  jti?: string
): Promise<boolean> {
  try {
    const key = getAccessTokenBlacklistKey(token, jti);
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error: any) {
    console.error('[Redis] Failed to check access token blacklist:', {
      jti,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to check access token blacklist: ${error.message}`);
  }
}

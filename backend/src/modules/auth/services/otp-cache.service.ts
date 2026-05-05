/**
 * OTP cache helpers
 * Tracks pending phone verification and rate limits in Redis
 */

import { redis } from '@/db/redis';
import { RedisOperationError } from '@/errors';
import { OTP_RATE_LIMIT } from '../config/otp-rate-limit';

const pendingPhoneKey = (userId: string) => `otp:pending:user:${userId}`;
const userRateLimitKey = (userId: string) => `otp:rl:user:${userId}`;

export type PendingPhoneVerification = {
  phone: string;
  ttlSeconds: number;
};

export type OtpRateLimitStatus = {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
};

export async function getPendingPhoneVerification(
  userId: string
): Promise<PendingPhoneVerification | null> {
  try {
    const key = pendingPhoneKey(userId);
    const data = await redis.hgetall(key);
    if (!data || !data.phone) {
      return null;
    }
    const ttlSeconds = await redis.ttl(key);
    return {
      phone: data.phone,
      ttlSeconds: ttlSeconds > 0 ? ttlSeconds : 0,
    };
  } catch (error: any) {
    console.error('[Redis] Failed to load pending phone verification:', {
      userId,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to load pending phone verification: ${error.message}`);
  }
}

export async function setPendingPhoneVerification(
  userId: string,
  phone: string,
  ttlSeconds: number
): Promise<void> {
  try {
    const key = pendingPhoneKey(userId);
    await redis.hset(key, {
      phone,
      createdAt: new Date().toISOString(),
    });
    await redis.expire(key, ttlSeconds);
  } catch (error: any) {
    console.error('[Redis] Failed to store pending phone verification:', {
      userId,
      phone,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to store pending phone verification: ${error.message}`);
  }
}

export async function clearPendingPhoneVerification(userId: string): Promise<void> {
  try {
    await redis.del(pendingPhoneKey(userId));
  } catch (error: any) {
    console.error('[Redis] Failed to clear pending phone verification:', {
      userId,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to clear pending phone verification: ${error.message}`);
  }
}

export async function getOtpRateResetSeconds(userId: string): Promise<number> {
  try {
    const ttl = await redis.ttl(userRateLimitKey(userId));
    return ttl > 0 ? ttl : 0;
  } catch (error: any) {
    console.error('[Redis] Failed to read OTP rate limit TTL:', {
      userId,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to read OTP rate limit TTL: ${error.message}`);
  }
}

export async function registerOtpRequest(userId: string): Promise<OtpRateLimitStatus> {
  try {
    const key = userRateLimitKey(userId);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, OTP_RATE_LIMIT.WINDOW_SECONDS);
    }
    const ttl = await redis.ttl(key);
    const remaining = Math.max(OTP_RATE_LIMIT.MAX_REQUESTS - count, 0);
    return {
      allowed: count <= OTP_RATE_LIMIT.MAX_REQUESTS,
      remaining,
      resetSeconds: ttl > 0 ? ttl : 0,
    };
  } catch (error: any) {
    console.error('[Redis] Failed to update OTP rate limit:', {
      userId,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to update OTP rate limit: ${error.message}`);
  }
}

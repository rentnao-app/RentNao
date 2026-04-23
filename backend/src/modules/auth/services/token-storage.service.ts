/**
 * Token storage service
 * Handles Redis storage and retrieval of verification and authentication tokens
 */

import { redis } from '@/db/redis';
import { hashToken } from '../utils/token-generator';
import { RedisOperationError } from '@/errors';
import type { VerificationTokenTypeType } from '@/types/enums';

/**
 * Store verification token in Redis
 * Pattern: verify:{type}:{identifier}
 * Structure: HASH { tokenHash, createdAt }
 */
export async function storeVerificationToken(
  identifier: string,
  token: string,
  type: VerificationTokenTypeType,
  ttlSeconds: number
): Promise<void> {
  try {
    const key = `verify:${type}:${identifier}`;
    const tokenHash = hashToken(token);
    
    await redis.hset(key, {
      tokenHash,
      createdAt: new Date().toISOString(),
    });
    
    await redis.expire(key, ttlSeconds);
  } catch (error: any) {
    console.error('[Redis] Failed to store verification token:', {
      type,
      identifier,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to store verification token: ${error.message}`);
  }
}

/**
 * Verify and retrieve token from Redis
 * Returns the stored data if token matches, null otherwise
 */
export async function verifyToken(
  identifier: string,
  token: string,
  type: VerificationTokenTypeType
): Promise<{ tokenHash: string; createdAt: string } | null> {
  try {
    const key = `verify:${type}:${identifier}`;
    const tokenHash = hashToken(token);
    
    const data = await redis.hgetall(key);
    
    if (!data || !data.tokenHash || !data.createdAt) {
      return null;
    }
    
    // Verify the token hash matches
    if (data.tokenHash !== tokenHash) {
      return null;
    }
    
    return {
      tokenHash: data.tokenHash,
      createdAt: data.createdAt,
    };
  } catch (error: any) {
    console.error('[Redis] Failed to verify token:', {
      type,
      identifier,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to verify token: ${error.message}`);
  }
}

/**
 * Delete verification token from Redis
 */
export async function deleteVerificationToken(
  identifier: string,
  type: VerificationTokenTypeType
): Promise<void> {
  try {
    const key = `verify:${type}:${identifier}`;
    await redis.del(key);
  } catch (error: any) {
    console.error('[Redis] Failed to delete verification token:', {
      type,
      identifier,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to delete verification token: ${error.message}`);
  }
}

/**
 * Check if verification token exists for an identifier
 */
export async function hasVerificationToken(
  identifier: string,
  type: VerificationTokenTypeType
): Promise<boolean> {
  try {
    const key = `verify:${type}:${identifier}`;
    const exists = await redis.exists(key);
    return exists === 1;
  } catch (error: any) {
    console.error('[Redis] Failed to check token existence:', {
      type,
      identifier,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to check token existence: ${error.message}`);
  }
}

/**
 * Get TTL (time to live) for a verification token
 * Returns -1 if key doesn't exist, -2 if key exists but has no expiry
 */
export async function getVerificationTokenTTL(
  identifier: string,
  type: VerificationTokenTypeType
): Promise<number> {
  try {
    const key = `verify:${type}:${identifier}`;
    return await redis.ttl(key);
  } catch (error: any) {
    console.error('[Redis] Failed to get token TTL:', {
      type,
      identifier,
      error: error.message,
    });
    throw new RedisOperationError(`Failed to get token TTL: ${error.message}`);
  }
}


/**
 * Redis client configuration and connection
 * Provides singleton Redis instance for the application
 */

import Redis from 'ioredis';
import { env } from '@/config/env';
import { RedisConnectionError } from '@/errors';

// Prevent multiple Redis instances in development
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
  isRedisShuttingDown: boolean | undefined;
};

/**
 * Create and configure Redis client with singleton pattern
 */
export const redis = globalForRedis.redis ??
  new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    maxRetriesPerRequest: env.REDIS_MAX_RETRIES,
    connectTimeout: env.REDIS_CONNECT_TIMEOUT,
    retryStrategy: (times: number) => {
      if (times > env.REDIS_MAX_RETRIES) {
        console.error('[Redis] Connection failed after maximum retries');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 50, 2000); // Exponential backoff, max 2s
      return delay;
    },
    lazyConnect: true, // Don't connect immediately, wait for explicit connect()
  });

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

/**
 * Event handlers for connection monitoring
 */
redis.on('ready', () => {
  console.log('[Redis] Connection ready');
});

redis.on('error', (error: any) => {
  console.error('[Redis] Client error:', {
    message: error.message,
    code: error.code,
    command: error.command,
  });
});

redis.on('close', () => {
  console.log('[Redis] Connection closed');
});

redis.on('reconnecting', (delay: number) => {
  console.log(`[Redis] Reconnecting in ${delay}ms...`);
});

/**
 * Initialize Redis connection
 */
export async function connectRedis(): Promise<void> {
  try {
    await redis.connect();
    console.log(`[Redis] Connected to ${env.REDIS_HOST}:${env.REDIS_PORT}`);
  } catch (error: any) {
    console.error('[Redis] Connection failed:', {
      message: error.message,
      code: error.code,
    });
    throw new RedisConnectionError(`Failed to connect to Redis: ${error.message}`);
  }
}

/**
 * Close Redis connection gracefully
 */
export async function disconnectRedis(): Promise<void> {
  if (globalForRedis.isRedisShuttingDown || redis.status === 'end') {
    return;
  }

  globalForRedis.isRedisShuttingDown = true;
  console.log('[Redis] Closing connection...');

  if (redis.status === 'wait') {
    redis.disconnect(false);
    console.log('[Redis] Disconnected');
    return;
  }

  await redis.quit();
  console.log('[Redis] Disconnected');
}

/**
 * Check if Redis is connected and healthy
 */
export async function checkRedisHealth(): Promise<boolean> {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch (error: any) {
    console.error('[Redis] Health check failed:', {
      message: error.message,
      code: error.code,
    });
    return false;
  }
}

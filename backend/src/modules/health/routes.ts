/**
 * Health check routes
 */

import { Hono } from 'hono';
import { checkDbHealth } from '@/db/client';
import { checkRedisHealth } from '@/db/redis';
import { checkS3Health } from '@/db/s3';
import { success } from '@/utils/response';

const health = new Hono();

// Basic health check
health.get('/', async (c) => {
  const dbHealthy = await checkDbHealth();
  const redisHealthy = await checkRedisHealth();
  const s3Healthy = await checkS3Health();

  const dbStatus = dbHealthy ? 'connected' : 'disconnected';
  const redisStatus = redisHealthy ? 'connected' : 'disconnected';
  const s3Status = s3Healthy ? 'connected' : 'disconnected';

  return success(c, {
    status: dbHealthy && redisHealthy && s3Healthy ? 'ok' : 'degraded',
    database: dbStatus,
    redis: redisStatus,
    s3: s3Status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default health;

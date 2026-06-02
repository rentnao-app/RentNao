/**
 * RentNao Backend API
 * Main application entry point
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { upgradeWebSocket, websocket } from 'hono/bun';
import { env } from '@/config/env';
import { defaultValidationHook } from '@/config/openapi';
import { errorHandler } from '@/middlewares/error-handler';
import { checkDbHealth, closeDbConnection } from '@/db/client';
import { connectRedis, checkRedisHealth, disconnectRedis } from '@/db/redis';
import { checkS3Health, ensureS3Bucket } from '@/db/s3';

// Import routes
import health from '@/modules/health/routes';
import auth from '@/modules/auth/controllers';
import admin from '@/modules/admin/controller';
import users from '@/modules/users';
import properties from '@/modules/properties';
import wallet from '@/modules/wallet';
import wishlists from '@/modules/wishlist';
import rentalRequests from '@/modules/rental-requests';
import notifications from '@/modules/notifications';
import testimonials from '@/modules/testimonials';
import conversations from '@/modules/conversations';
import { chatWebSocketHandler } from '@/modules/conversations/ws/ws-handler';
import { startHeartbeat, stopHeartbeat } from '@/modules/conversations/ws/ws-registry';
import { startScheduledJobs, stopScheduledJobs } from '@/jobs/scheduler';
import { bearerAuth } from 'hono/bearer-auth';

const app = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

// Global middlewares
app.use('*', logger());
const corsOriginRaw = env.CORS_ORIGIN.trim();
const corsOrigin =
  corsOriginRaw === '*'
    ? '*'
    : corsOriginRaw.includes(',')
      ? corsOriginRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : corsOriginRaw;
app.use('*', cors({
  origin: corsOrigin,
  credentials: true,
}));

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'RentNao API',
    version: '1.1.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    documentation: `${c.req.url.replace(/\/$/, '')}/docs`,
    openapi: `${c.req.url.replace(/\/$/, '')}/openapi.json`,
  });
});

// Mount module routes
app.route('/health', health);
app.route('/auth', auth);
app.route('/admin', admin);
app.route('/users', users);
app.route('/properties', properties);
app.route('/wallet', wallet);
app.route('/wishlists', wishlists);
app.route('/requests', rentalRequests);
app.route('/notifications', notifications);
app.route('/testimonials', testimonials);
app.route('/conversations', conversations);

// WebSocket endpoint for real-time chat and notifications
app.get('/ws', upgradeWebSocket(chatWebSocketHandler));

app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

// OpenAPI documentation
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'RentNao API',
    version: '1.1.0',
    description: 'RESTful API for RentNao - Property rental platform for Bangladesh',
  },
  servers: [
    {
      url: env.NODE_ENV === 'production' ? 'https://api.rentnao.com' : 'http://localhost:3000',
      description: env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User registration, verification, and authentication endpoints',
    },
    {
      name: 'Users - Profile',
      description: 'User profile and account endpoints',
    },
    {
      name: 'Users - Verification',
      description: 'User identity document upload and verification submission endpoints',
    },
    {
      name: 'Properties',
      description: 'Owner property creation and management endpoints',
    },
    {
      name: 'Wallet',
      description: 'Wallet management, charges, and transaction history',
    },
    {
      name: 'Wishlist',
      description: 'Tenant saved listings',
    },
    {
      name: 'Rental requests',
      description: 'Tenant rental requests and owner responses',
    },
    {
      name: 'Notifications',
      description: 'In-app user notifications',
    },
    {
      name: 'Testimonials',
      description: 'User feedback and platform testimonials',
    },
    {
      name: 'Conversations',
      description: 'Listing-based chat conversations and real-time messaging',
    },
    {
      name: 'Admin - User Management',
      description: 'Administrative user management endpoints',
    },
    {
      name: 'Admin - KYC Review',
      description: 'Administrative KYC review and decision endpoints',
    },
    {
      name: 'Admin - Statistics',
      description: 'Administrative dashboard and analytics endpoints',
    },
    {
      name: 'Admin - Fee Policies',
      description: 'Administrative fee policy creation and management endpoints',
    },
  ],
});

// API documentation UI (Scalar)
app.get(
  '/docs',
  Scalar({
    theme: 'purple',
    url: '/openapi.json',
  })
);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Route not found',
      path: c.req.path,
    },
    404
  );
});

// Error handler (must be last)
app.onError(errorHandler);

const port = parseInt(env.PORT);
let isShuttingDown = false;

// Test database connection on startup
checkDbHealth()
  .then((healthy) => {
    console.log(`Database connection: ${healthy ? 'OK' : 'FAILED'}`);
    if (!healthy) {
      console.error('Database connection failed');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  });

// Initialize Redis connection
connectRedis()
  .then(async () => {
    const healthy = await checkRedisHealth();
    console.log(`Redis connection: ${healthy ? 'OK' : 'FAILED'}`);
    if (!healthy) {
      process.exit(1);
    }

    // Start WebSocket heartbeat and scheduled jobs after Redis is ready
    startHeartbeat();
    startScheduledJobs();
  })
  .catch((err) => {
    console.error('Redis connection failed:', err.message);
    process.exit(1);
  });

// Initialize S3 bucket and check S3 connection (requiredness is configurable)
ensureS3Bucket()
  .then(async () => {
    const healthy = await checkS3Health();
    console.log(`S3 connection: ${healthy ? 'OK' : 'FAILED'}`);
    if (!healthy && env.S3_REQUIRED) {
      console.error('S3 connection failed and S3_REQUIRED=true');
      process.exit(1);
    }
  })
  .catch((err) => {
    console.error('S3 initialization/check failed:', err.message);
    if (env.S3_REQUIRED) {
      process.exit(1);
    }
  });

console.log(`Environment: ${env.NODE_ENV}`);

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`\n[App] ${signal} received, shutting down...`);

  // Stop background tasks first
  stopHeartbeat();
  stopScheduledJobs();

  const [dbResult, redisResult] = await Promise.allSettled([
    closeDbConnection(),
    disconnectRedis(),
  ]);

  if (dbResult.status === 'rejected') {
    console.error('[App] Database shutdown failed:', {
      message: dbResult.reason?.message,
    });
  }

  if (redisResult.status === 'rejected') {
    console.error('[App] Redis shutdown failed:', {
      message: redisResult.reason?.message,
    });
  }

  process.exit(0);
};

process.once('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

process.once('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});

export default {
  port,
  fetch: app.fetch,
  websocket,
};
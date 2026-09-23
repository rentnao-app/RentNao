import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';

const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string(),
});

const notificationSchema = z.object({
  notification_id: z.string(),
  title: z.string(),
  message: z.string(),
  data: z.any().nullable().optional(),
  is_read: z.boolean(),
  created_at: z.string(),
});

export const listNotificationsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Notifications'],
  summary: 'List my notifications',
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).optional().openapi({ example: 50 }),
    }),
  },
  responses: {
    200: {
      description: 'Notifications',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            notifications: z.array(notificationSchema),
          }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const unreadCountRoute = createRoute({
  method: 'get',
  path: '/unread-count',
  tags: ['Notifications'],
  summary: 'Unread notification count',
  responses: {
    200: {
      description: 'Count',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            count: z.number().int(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const readAllRoute = createRoute({
  method: 'patch',
  path: '/read-all',
  tags: ['Notifications'],
  summary: 'Mark all notifications read',
  responses: {
    200: {
      description: 'Updated',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const markOneReadRoute = createRoute({
  method: 'patch',
  path: '/{notificationId}/read',
  tags: ['Notifications'],
  summary: 'Mark one notification read',
  request: {
    params: z.object({
      notificationId: z.string().min(1).openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
    }),
  },
  responses: {
    200: {
      description: 'Updated',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean(), updated: z.boolean() }),
        },
      },
    },
    404: { description: 'Not found', content: { 'application/json': { schema: errorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

// Push Notification Subscription Routes

export const subscribePushRoute = createRoute({
  method: 'post',
  path: '/push/subscribe',
  tags: ['Notifications'],
  summary: 'Subscribe to push notifications',
  description: 'Save an FCM token for the current user to receive push notifications on this device.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            fcm_token: z.string().min(1).openapi({ example: 'eB1rT3k...' }),
            device_name: z.string().optional().openapi({ example: 'My Laptop' }),
            browser: z.string().optional().openapi({ example: 'Chrome 126' }),
            platform: z.string().optional().openapi({ example: 'Windows' }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Subscribed',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const unsubscribePushRoute = createRoute({
  method: 'post',
  path: '/push/unsubscribe',
  tags: ['Notifications'],
  summary: 'Unsubscribe from push notifications',
  description: 'Remove an FCM token for the current user (e.g., on logout).',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            fcm_token: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Unsubscribed',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

// Admin Broadcast Routes

export const adminBroadcastRoute = createRoute({
  method: 'post',
  path: '/push/admin/broadcast',
  tags: ['Notifications'],
  summary: 'Broadcast push notification (Admin)',
  description:
    'Send a push notification to specific users, a specific role, or all users. If user_ids is omitted, broadcasts to all active users. Use target_role to filter by role.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).max(200).openapi({ example: 'Platform Update' }),
            body: z.string().min(1).max(1000).openapi({ example: 'We have exciting new features!' }),
            user_ids: z.array(z.string()).optional().openapi({
              description: 'Specific user IDs to notify. Omit to broadcast to all users.',
            }),
            target_role: z.enum(['TENANT', 'OWNER', 'ADMIN']).optional().openapi({
              description: 'Filter broadcast to only users with this role. Ignored if user_ids is provided.',
            }),
            data: z.record(z.string(), z.string()).optional().openapi({
              description: 'Optional key-value data payload.',
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Broadcast result',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            sent: z.number().int(),
            failed: z.number().int(),
          }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

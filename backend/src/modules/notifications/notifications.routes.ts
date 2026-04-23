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

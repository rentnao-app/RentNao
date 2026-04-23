import { createRoute } from '@hono/zod-openapi';
import {
  userIdParamSchema,
  sessionIdParamSchema,
  sessionListResponseSchema,
  successMessageResponseSchema,
  errorResponseSchema,
} from '../schemas';

export const getUserSessionsRoute = createRoute({
  method: 'get',
  path: '/users/{userId}/sessions',
  tags: ['Admin - Session Management'],
  summary: 'Get user sessions',
  description: 'List all active sessions for a specific user',
  request: { params: userIdParamSchema },
  responses: {
    200: { description: 'Sessions retrieved successfully', content: { 'application/json': { schema: sessionListResponseSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const invalidateUserSessionsRoute = createRoute({
  method: 'delete',
  path: '/users/{userId}/sessions',
  tags: ['Admin - Session Management'],
  summary: 'Invalidate all user sessions',
  description: 'Force logout user by invalidating all their sessions',
  request: { params: userIdParamSchema },
  responses: {
    200: { description: 'Sessions invalidated successfully', content: { 'application/json': { schema: successMessageResponseSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const invalidateSessionRoute = createRoute({
  method: 'delete',
  path: '/sessions/{sessionId}',
  tags: ['Admin - Session Management'],
  summary: 'Invalidate specific session',
  description: 'Invalidate a single session by session ID',
  request: { params: sessionIdParamSchema },
  responses: {
    200: { description: 'Session invalidated successfully', content: { 'application/json': { schema: successMessageResponseSchema } } },
    404: { description: 'Session not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

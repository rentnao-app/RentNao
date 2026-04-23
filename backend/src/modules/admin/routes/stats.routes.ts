import { createRoute } from '@hono/zod-openapi';
import {
  statsOverviewResponseSchema,
  errorResponseSchema,
} from '../schemas';

export const getStatsOverviewRoute = createRoute({
  method: 'get',
  path: '/stats/overview',
  tags: ['Admin - Statistics'],
  summary: 'Get dashboard statistics',
  description: 'Get overview statistics for admin dashboard',
  responses: {
    200: {
      description: 'Statistics retrieved successfully',
      content: { 'application/json': { schema: statsOverviewResponseSchema } },
    },
    403: {
      description: 'Forbidden - Admin access required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

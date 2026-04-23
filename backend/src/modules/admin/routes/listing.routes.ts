import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import {
  adminListingsQuerySchema,
  listingIdParamSchema,
  publicListingListResponseSchema,
  unlockedListingDetailSchema,
} from '@/modules/properties/schemas';
import { errorResponseSchema } from '../schemas';

export const listAdminListingsRoute = createRoute({
  method: 'get',
  path: '/listings',
  tags: ['Admin - Listings'],
  summary: 'List all property listings',
  description: 'Paginated listings across all statuses, with the same search filters as the public catalog.',
  request: {
    query: adminListingsQuerySchema,
  },
  responses: {
    200: {
      description: 'Listings retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: publicListingListResponseSchema,
          }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const getAdminListingDetailRoute = createRoute({
  method: 'get',
  path: '/listings/{listingId}',
  tags: ['Admin - Listings'],
  summary: 'Get full listing detail (admin)',
  description: 'Returns full property and owner contact details for any listing.',
  request: {
    params: listingIdParamSchema,
  },
  responses: {
    200: {
      description: 'Listing detail',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: unlockedListingDetailSchema,
          }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

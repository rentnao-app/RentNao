import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';

const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string(),
});

export const listingIdParamSchema = z.object({
  listingId: z.string().openapi({
    param: { name: 'listingId', in: 'path' },
    example: 'listing-id-uuid',
    description: 'Listing ID',
  }),
});

const wishlistItemSchema = z.object({
  listingId: z.string(),
  propertyId: z.string(),
  title: z.string().nullable(),
  rent: z.number(),
  areaName: z.string().nullable(),
  roomCount: z.number().nullable(),
  bathroomCount: z.number().nullable(),
  propertySizeSqft: z.number().nullable(),
  listingStatus: z.string(),
  primaryImageUrl: z.string().nullable(),
  addedAt: z.string(),
});

export const listWishlistRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Wishlist'],
  summary: 'List my wishlist',
  responses: {
    200: {
      description: 'Wishlist items',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              items: z.array(wishlistItemSchema),
            }),
          }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const addWishlistRoute = createRoute({
  method: 'post',
  path: '/{listingId}',
  tags: ['Wishlist'],
  summary: 'Add listing to wishlist',
  request: { params: listingIdParamSchema },
  responses: {
    201: {
      description: 'Added',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean(), message: z.string().optional() }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const removeWishlistRoute = createRoute({
  method: 'delete',
  path: '/{listingId}',
  tags: ['Wishlist'],
  summary: 'Remove listing from wishlist',
  request: { params: listingIdParamSchema },
  responses: {
    200: {
      description: 'Removed',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const wishlistStatusRoute = createRoute({
  method: 'get',
  path: '/{listingId}/status',
  tags: ['Wishlist'],
  summary: 'Check if listing is wishlisted',
  request: { params: listingIdParamSchema },
  responses: {
    200: {
      description: 'Status',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ wishlisted: z.boolean() }),
          }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

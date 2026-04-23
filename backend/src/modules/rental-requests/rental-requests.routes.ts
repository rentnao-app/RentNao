import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';

const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string(),
});

export const requestIdParamSchema = z.object({
  requestId: z.string().openapi({
    param: { name: 'requestId', in: 'path' },
    description: 'Rental request ID',
  }),
});

export const listingIdParamSchema = z.object({
  listingId: z.string().openapi({
    param: { name: 'listingId', in: 'path' },
    description: 'Listing ID',
  }),
});

const rentalRequestEnvelope = z.object({
  success: z.boolean(),
  data: z.object({
    requests: z.array(z.any()),
  }),
});

const createBodySchema = z.object({
  listingId: z.string().min(1),
  message: z.string().max(2000).optional(),
});

export const createRentalRequestRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Rental requests'],
  summary: 'Send a rental request (tenant)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Created',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({ request_id: z.string() }),
            message: z.string().optional(),
          }),
        },
      },
    },
    400: { description: 'Bad request', content: { 'application/json': { schema: errorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: errorResponseSchema } } },
    409: { description: 'Conflict', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const listMineRoute = createRoute({
  method: 'get',
  path: '/mine',
  tags: ['Rental requests'],
  summary: 'List my rental requests (tenant)',
  responses: {
    200: {
      description: 'Requests',
      content: { 'application/json': { schema: rentalRequestEnvelope } },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const listIncomingRoute = createRoute({
  method: 'get',
  path: '/incoming',
  tags: ['Rental requests'],
  summary: 'List rental requests for my properties (owner)',
  responses: {
    200: {
      description: 'Requests',
      content: { 'application/json': { schema: rentalRequestEnvelope } },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const myStatusRoute = createRoute({
  method: 'get',
  path: '/listing/{listingId}/my-status',
  tags: ['Rental requests'],
  summary: 'My latest request status for a listing (tenant)',
  request: { params: listingIdParamSchema },
  responses: {
    200: {
      description: 'Status',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              hasPending: z.boolean(),
              status: z.string().nullable(),
            }),
          }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const withdrawRoute = createRoute({
  method: 'post',
  path: '/{requestId}/withdraw',
  tags: ['Rental requests'],
  summary: 'Cancel my pending rental request (tenant)',
  request: { params: requestIdParamSchema },
  responses: {
    200: {
      description: 'Cancelled',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const acceptRoute = createRoute({
  method: 'post',
  path: '/{requestId}/accept',
  tags: ['Rental requests'],
  summary: 'Approve rental request (owner)',
  request: { params: requestIdParamSchema },
  responses: {
    200: {
      description: 'Approved',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
    400: { description: 'Bad request', content: { 'application/json': { schema: errorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const rejectRoute = createRoute({
  method: 'post',
  path: '/{requestId}/reject',
  tags: ['Rental requests'],
  summary: 'Reject rental request (owner)',
  request: { params: requestIdParamSchema },
  responses: {
    200: {
      description: 'Rejected',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
    400: { description: 'Bad request', content: { 'application/json': { schema: errorResponseSchema } } },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const deleteRequestRoute = createRoute({
  method: 'delete',
  path: '/{requestId}',
  tags: ['Rental requests'],
  summary: 'Remove rental request from dashboard (owner)',
  request: { params: requestIdParamSchema },
  responses: {
    200: {
      description: 'Deleted',
      content: { 'application/json': { schema: z.object({ success: z.boolean() }) } },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

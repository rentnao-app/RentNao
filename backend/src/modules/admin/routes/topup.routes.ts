import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import * as walletSchemas from '../../wallet/schemas';

// ============================================================================
// List Topup Requests (Admin)
// ============================================================================

const listTopupRequestsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .openapi({ example: '1', description: 'Page number (1-indexed)' }),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .openapi({ example: '20', description: 'Results per page' }),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional().openapi({
    example: 'PENDING',
    description: 'Filter by topup request status',
  }),
});

export const listTopupRequestsRoute = createRoute({
  method: 'get',
  path: '/topup-requests',
  tags: ['Admin - Wallet'],
  summary: 'List topup requests',
  description: 'Get paginated list of all topup requests (admin only)',
  request: {
    query: listTopupRequestsQuerySchema,
  },
  responses: {
    200: {
      description: 'Topup requests retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: walletSchemas.topupRequestsListResponseSchema,
          }),
        },
      },
    },
    403: {
      description: 'Forbidden - Admin access required',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.string(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Approve Topup Request (Admin)
// ============================================================================

const topupRequestIdParamSchema = z.object({
  topupRequestId: z.string().openapi({
    example: 'cm4topup123xyz',
    description: 'Topup request ID',
  }),
});

export const approveTopupRequestRoute = createRoute({
  method: 'post',
  path: '/topup-requests/{topupRequestId}/approve',
  tags: ['Admin - Wallet'],
  summary: 'Approve topup request',
  description: 'Approve a pending topup request and credit wallet',
  request: {
    params: topupRequestIdParamSchema,
  },
  responses: {
    200: {
      description: 'Topup request approved and wallet credited',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              topupRequestId: z.string(),
              walletTransactionId: z.string(),
              creditedAmount: z.string(),
            }),
          }),
        },
      },
    },
    404: {
      description: 'Topup request not found',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.string(),
          }),
        },
      },
    },
    403: {
      description: 'Forbidden - Admin access required',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.string(),
          }),
        },
      },
    },
    409: {
      description: 'Topup request already processed',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.string(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Reject Topup Request (Admin)
// ============================================================================

export const rejectTopupRequestRoute = createRoute({
  method: 'post',
  path: '/topup-requests/{topupRequestId}/reject',
  tags: ['Admin - Wallet'],
  summary: 'Reject topup request',
  description: 'Reject a pending topup request with a reason',
  request: {
    params: topupRequestIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: walletSchemas.rejectTopupRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Topup request rejected',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              topupRequestId: z.string(),
            }),
          }),
        },
      },
    },
    404: {
      description: 'Topup request not found',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.string(),
          }),
        },
      },
    },
    403: {
      description: 'Forbidden - Admin access required',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.string(),
          }),
        },
      },
    },
    409: {
      description: 'Topup request already processed',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.string(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

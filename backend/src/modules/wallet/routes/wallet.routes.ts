/**
 * Wallet routes - OpenAPI definitions
 *
 * Routes:
 *   GET    /wallet                  - Get wallet account
 *   GET    /wallet/transactions     - Get wallet transactions
 *   POST   /wallet/topup            - Create topup request
 *   GET    /wallet/topup/:topupId   - Get topup request status
 *   GET    /wallet/charges          - Get charges/fees
 *   GET    /wallet/fees/:feeCode    - Get active fee amount
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import * as schemas from '../schemas';

// ============================================================================
// Get Wallet Account
// ============================================================================

export const getWalletRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Wallet'],
  summary: 'Get wallet account details',
  description: 'Retrieve wallet account balance and status',
  responses: {
    200: {
      description: 'Wallet account retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: schemas.walletAccountSchema,
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Get Wallet Transactions
// ============================================================================

const paginationParamsSchema = z.object({
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
});

export const getTransactionsRoute = createRoute({
  method: 'get',
  path: '/transactions',
  tags: ['Wallet'],
  summary: 'Get wallet transactions',
  description: 'Retrieve paginated wallet transaction history',
  request: {
    query: paginationParamsSchema,
  },
  responses: {
    200: {
      description: 'Wallet transactions retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: schemas.walletTransactionsResponseSchema,
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Create Topup Request
// ============================================================================

export const createTopupRoute = createRoute({
  method: 'post',
  path: '/topup',
  tags: ['Wallet'],
  summary: 'Process wallet topup',
  description: 'Processes bKash topup using create, execute, and query flow in a single request',
  request: {
    body: {
      content: {
        'application/json': {
          schema: schemas.createTopupRequestSchema,
          examples: {
            bkash: {
              summary: 'bKash topup',
              value: {
                amount: 500,
                provider: 'BKASH',
              },
            },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Topup request processed',
      content: {
        'application/json': {
          schema: schemas.createTopupResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Get Topup Request Status
// ============================================================================

const topupIdParamSchema = z.object({
  topupId: z.string().openapi({
    param: { name: 'topupId', in: 'path' },
    example: 'cm4topup123xyz',
    description: 'Topup request ID',
  }),
});

export const getTopupRoute = createRoute({
  method: 'get',
  path: '/topup/{topupId}',
  tags: ['Wallet'],
  summary: 'Get topup request status',
  description: 'Check the status of a topup request initiated previously',
  request: {
    params: topupIdParamSchema,
  },
  responses: {
    200: {
      description: 'Topup request details retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: schemas.walletTopupRequestSchema,
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Get Charges
// ============================================================================

export const getChargesRoute = createRoute({
  method: 'get',
  path: '/charges',
  tags: ['Wallet'],
  summary: 'Get wallet charges',
  description: 'Retrieve paginated list of charges/fees applied to wallet',
  request: {
    query: paginationParamsSchema,
  },
  responses: {
    200: {
      description: 'Charges retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: schemas.chargesResponseSchema,
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Get Active Fee Amount
// ============================================================================

export const getActiveFeeRoute = createRoute({
  method: 'get',
  path: '/fees/{feeCode}',
  tags: ['Wallet'],
  summary: 'Get active fee amount',
  description: 'Retrieve the currently active amount for a wallet-debited action.',
  request: {
    params: schemas.feePolicyCodeParamSchema,
  },
  responses: {
    200: {
      description: 'Active fee amount retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: schemas.activeFeePolicySchema,
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Webhook: bKash Payment Callback
// ============================================================================

export const bkashWebhookRoute = createRoute({
  method: 'get',
  path: '/webhooks/bkash',
  tags: ['Wallet'],
  summary: 'bKash payment callback webhook',
  description:
    'Callback endpoint for bKash; validates query and then executes payment to verify final status before any wallet credit.',
  request: {
    query: schemas.bkashCallbackQuerySchema,
  },
  responses: {
    200: {
      description: 'Callback processed successfully',
      content: {
        'application/json': {
          schema: schemas.bkashCallbackResponseSchema,
        },
      },
    },
  },
});


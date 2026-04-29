/**
 * Wallet routes - OpenAPI definitions
 * 
 * Routes:
 *   GET    /wallet                  - Get wallet account
 *   GET    /wallet/transactions     - Get wallet transactions
 *   GET    /wallet/charges          - Get charges/fees
 *   POST   /wallet/topup            - Create topup request
 *   GET    /wallet/topup            - Get user's topup requests
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
// Create Topup Request
// ============================================================================

export const createTopupRoute = createRoute({
  method: 'post',
  path: '/topup',
  tags: ['Wallet'],
  summary: 'Request wallet topup',
  description: 'Submit a topup request with bKash transaction details for admin approval',
  request: {
    body: {
      content: {
        'application/json': {
          schema: schemas.createTopupRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Topup request created',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: schemas.topupRequestSchema,
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Get User's Topup Requests
// ============================================================================

export const getUserTopupRequestsRoute = createRoute({
  method: 'get',
  path: '/topup',
  tags: ['Wallet'],
  summary: 'Get user topup requests',
  description: 'Retrieve user topup request history (paginated)',
  request: {
    query: paginationParamsSchema,
  },
  responses: {
    200: {
      description: 'User topup requests retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: schemas.topupRequestsListResponseSchema,
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});


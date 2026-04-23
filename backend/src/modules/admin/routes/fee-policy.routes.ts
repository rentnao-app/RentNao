import { createRoute } from '@hono/zod-openapi';
import {
  listFeePoliciesQuerySchema,
  feePolicyIdParamSchema,
  createFeePolicySchema,
  updateFeePolicySchema,
  feePolicyListResponseSchema,
  feePolicyResponseSchema,
  feePolicyMutationResponseSchema,
  errorResponseSchema,
} from '../schemas';

export const listFeePoliciesRoute = createRoute({
  method: 'get',
  path: '/fee-policies',
  tags: ['Admin - Fee Policies'],
  summary: 'List fee policies',
  description: 'Get paginated fee policies with optional filters',
  request: { query: listFeePoliciesQuerySchema },
  responses: {
    200: { description: 'Fee policies retrieved successfully', content: { 'application/json': { schema: feePolicyListResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const getFeePolicyByIdRoute = createRoute({
  method: 'get',
  path: '/fee-policies/{feePolicyId}',
  tags: ['Admin - Fee Policies'],
  summary: 'Get fee policy details',
  description: 'Get complete details of a fee policy',
  request: { params: feePolicyIdParamSchema },
  responses: {
    200: { description: 'Fee policy retrieved successfully', content: { 'application/json': { schema: feePolicyResponseSchema } } },
    404: { description: 'Fee policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const createFeePolicyRoute = createRoute({
  method: 'post',
  path: '/fee-policies',
  tags: ['Admin - Fee Policies'],
  summary: 'Create fee policy',
  description: 'Create a new versioned fee policy',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createFeePolicySchema,
        },
      },
    },
  },
  responses: {
    201: { description: 'Fee policy created successfully', content: { 'application/json': { schema: feePolicyMutationResponseSchema } } },
    400: { description: 'Invalid request', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const updateFeePolicyRoute = createRoute({
  method: 'patch',
  path: '/fee-policies/{feePolicyId}',
  tags: ['Admin - Fee Policies'],
  summary: 'Update fee policy',
  description: 'Update fee policy fields, including active status and schedule',
  request: {
    params: feePolicyIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updateFeePolicySchema,
        },
      },
    },
  },
  responses: {
    200: { description: 'Fee policy updated successfully', content: { 'application/json': { schema: feePolicyMutationResponseSchema } } },
    404: { description: 'Fee policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const activateFeePolicyRoute = createRoute({
  method: 'post',
  path: '/fee-policies/{feePolicyId}/activate',
  tags: ['Admin - Fee Policies'],
  summary: 'Activate fee policy',
  description: 'Activate this fee policy and deactivate other versions with the same code',
  request: { params: feePolicyIdParamSchema },
  responses: {
    200: { description: 'Fee policy activated successfully', content: { 'application/json': { schema: feePolicyMutationResponseSchema } } },
    404: { description: 'Fee policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const deactivateFeePolicyRoute = createRoute({
  method: 'post',
  path: '/fee-policies/{feePolicyId}/deactivate',
  tags: ['Admin - Fee Policies'],
  summary: 'Deactivate fee policy',
  description: 'Deactivate this fee policy',
  request: { params: feePolicyIdParamSchema },
  responses: {
    200: { description: 'Fee policy deactivated successfully', content: { 'application/json': { schema: feePolicyMutationResponseSchema } } },
    404: { description: 'Fee policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

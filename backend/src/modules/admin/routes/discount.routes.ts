import { createRoute } from '@hono/zod-openapi';
import {
  listDiscountPoliciesQuerySchema,
  discountPolicyIdParamSchema,
  createDiscountPolicySchema,
  updateDiscountPolicySchema,
  discountPolicyListResponseSchema,
  discountPolicyResponseSchema,
  discountPolicyMutationResponseSchema,
  discountEligibleUsersResponseSchema,
  updateEligibleUsersSchema,
  updateEligibleUsersResponseSchema,
  errorResponseSchema,
} from '../schemas';

export const listDiscountPoliciesRoute = createRoute({
  method: 'get',
  path: '/discount-policies',
  tags: ['Admin - Discounts'],
  summary: 'List discount policies',
  description: 'Get paginated discount policies with optional filters',
  request: { query: listDiscountPoliciesQuerySchema },
  responses: {
    200: {
      description: 'Discount policies retrieved successfully',
      content: { 'application/json': { schema: discountPolicyListResponseSchema } },
    },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const getDiscountPolicyByIdRoute = createRoute({
  method: 'get',
  path: '/discount-policies/{discountPolicyId}',
  tags: ['Admin - Discounts'],
  summary: 'Get discount policy details',
  description: 'Get complete details of a discount policy',
  request: { params: discountPolicyIdParamSchema },
  responses: {
    200: { description: 'Discount policy retrieved successfully', content: { 'application/json': { schema: discountPolicyResponseSchema } } },
    404: { description: 'Discount policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const createDiscountPolicyRoute = createRoute({
  method: 'post',
  path: '/discount-policies',
  tags: ['Admin - Discounts'],
  summary: 'Create discount policy',
  description: 'Create a discount policy',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createDiscountPolicySchema,
        },
      },
    },
  },
  responses: {
    201: { description: 'Discount policy created successfully', content: { 'application/json': { schema: discountPolicyMutationResponseSchema } } },
    400: { description: 'Invalid request', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const updateDiscountPolicyRoute = createRoute({
  method: 'patch',
  path: '/discount-policies/{discountPolicyId}',
  tags: ['Admin - Discounts'],
  summary: 'Update discount policy',
  description: 'Update discount policy fields, including active status and schedule',
  request: {
    params: discountPolicyIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updateDiscountPolicySchema,
        },
      },
    },
  },
  responses: {
    200: { description: 'Discount policy updated successfully', content: { 'application/json': { schema: discountPolicyMutationResponseSchema } } },
    404: { description: 'Discount policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const activateDiscountPolicyRoute = createRoute({
  method: 'post',
  path: '/discount-policies/{discountPolicyId}/activate',
  tags: ['Admin - Discounts'],
  summary: 'Activate discount policy',
  description: 'Activate this discount policy',
  request: { params: discountPolicyIdParamSchema },
  responses: {
    200: { description: 'Discount policy activated successfully', content: { 'application/json': { schema: discountPolicyMutationResponseSchema } } },
    404: { description: 'Discount policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const deactivateDiscountPolicyRoute = createRoute({
  method: 'post',
  path: '/discount-policies/{discountPolicyId}/deactivate',
  tags: ['Admin - Discounts'],
  summary: 'Deactivate discount policy',
  description: 'Deactivate this discount policy',
  request: { params: discountPolicyIdParamSchema },
  responses: {
    200: { description: 'Discount policy deactivated successfully', content: { 'application/json': { schema: discountPolicyMutationResponseSchema } } },
    404: { description: 'Discount policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const listDiscountEligibleUsersRoute = createRoute({
  method: 'get',
  path: '/discount-policies/{discountPolicyId}/eligible-users',
  tags: ['Admin - Discounts'],
  summary: 'List eligible users',
  description: 'Get paginated eligible users for a discount policy',
  request: {
    params: discountPolicyIdParamSchema,
    query: listDiscountPoliciesQuerySchema.pick({ page: true, limit: true }),
  },
  responses: {
    200: { description: 'Eligible users retrieved successfully', content: { 'application/json': { schema: discountEligibleUsersResponseSchema } } },
    404: { description: 'Discount policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const addDiscountEligibleUsersRoute = createRoute({
  method: 'post',
  path: '/discount-policies/{discountPolicyId}/eligible-users',
  tags: ['Admin - Discounts'],
  summary: 'Add eligible users',
  description: 'Add users to the discount policy eligibility list',
  request: {
    params: discountPolicyIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updateEligibleUsersSchema,
        },
      },
    },
  },
  responses: {
    200: { description: 'Eligible users added successfully', content: { 'application/json': { schema: updateEligibleUsersResponseSchema } } },
    404: { description: 'Discount policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const removeDiscountEligibleUsersRoute = createRoute({
  method: 'post',
  path: '/discount-policies/{discountPolicyId}/eligible-users/remove',
  tags: ['Admin - Discounts'],
  summary: 'Remove eligible users',
  description: 'Remove users from the discount policy eligibility list',
  request: {
    params: discountPolicyIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updateEligibleUsersSchema,
        },
      },
    },
  },
  responses: {
    200: { description: 'Eligible users removed successfully', content: { 'application/json': { schema: updateEligibleUsersResponseSchema } } },
    404: { description: 'Discount policy not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

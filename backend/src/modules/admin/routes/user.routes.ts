import { createRoute, z } from '@hono/zod-openapi';
import {
  listUsersQuerySchema,
  userIdParamSchema,
  updateOnboardingStatusSchema,
  updateRoleSchema,
  updateActiveStatusSchema,
  userListResponseSchema,
  userDetailResponseSchema,
  userUpdateResponseSchema,
  successMessageResponseSchema,
  errorResponseSchema,
  forceKycStatusSchema,
} from '../schemas';

export const listUsersRoute = createRoute({
  method: 'get',
  path: '/users',
  tags: ['Admin - User Management'],
  summary: 'List all users',
  description: 'Get paginated list of users with optional filters',
  request: { query: listUsersQuerySchema },
  responses: {
    200: { description: 'Users retrieved successfully', content: { 'application/json': { schema: userListResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const getUserByIdRoute = createRoute({
  method: 'get',
  path: '/users/{userId}',
  tags: ['Admin - User Management'],
  summary: 'Get user details',
  description: 'Get complete user information including credentials and sessions',
  request: { params: userIdParamSchema },
  responses: {
    200: { description: 'User details retrieved successfully', content: { 'application/json': { schema: userDetailResponseSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const updateOnboardingStatusRoute = createRoute({
  method: 'patch',
  path: '/users/{userId}/onboarding-status',
  tags: ['Admin - User Management'],
  summary: 'Update user onboarding status',
  description: 'Manually advance or reset user onboarding progress',
  request: {
    params: userIdParamSchema,
    body: { content: { 'application/json': { schema: updateOnboardingStatusSchema } } },
  },
  responses: {
    200: { description: 'Onboarding status updated successfully', content: { 'application/json': { schema: userUpdateResponseSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const updateRoleRoute = createRoute({
  method: 'patch',
  path: '/users/{userId}/role',
  tags: ['Admin - User Management'],
  summary: 'Update user role',
  description: 'Change user role. Cannot modify own role.',
  request: {
    params: userIdParamSchema,
    body: { content: { 'application/json': { schema: updateRoleSchema } } },
  },
  responses: {
    200: { description: 'Role updated successfully', content: { 'application/json': { schema: userUpdateResponseSchema } } },
    400: { description: 'Cannot modify own role', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const updateActiveStatusRoute = createRoute({
  method: 'patch',
  path: '/users/{userId}/active',
  tags: ['Admin - User Management'],
  summary: 'Activate/deactivate user account',
  description: 'Activate or deactivate user account. Invalidates sessions if deactivating. Cannot modify own account.',
  request: {
    params: userIdParamSchema,
    body: { content: { 'application/json': { schema: updateActiveStatusSchema } } },
  },
  responses: {
    200: { description: 'Active status updated successfully', content: { 'application/json': { schema: userUpdateResponseSchema } } },
    400: { description: 'Cannot modify own account', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const softDeleteUserRoute = createRoute({
  method: 'delete',
  path: '/users/{userId}',
  tags: ['Admin - User Management'],
  summary: 'Soft delete user',
  description: 'Soft delete user account (sets deleted_at timestamp). Deactivates and invalidates sessions. Cannot delete own account.',
  request: { params: userIdParamSchema },
  responses: {
    200: { description: 'User deleted successfully', content: { 'application/json': { schema: successMessageResponseSchema } } },
    400: { description: 'Cannot delete own account', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const hardDeleteUserRoute = createRoute({
  method: 'delete',
  path: '/users/{userId}/hard-delete',
  tags: ['Admin - User Management'],
  summary: 'Hard delete user',
  description: 'Permanently delete user account and dependent records. Cannot delete own account.',
  request: { params: userIdParamSchema },
  responses: {
    200: { description: 'User permanently deleted', content: { 'application/json': { schema: successMessageResponseSchema } } },
    400: { description: 'Cannot delete own account', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const restoreUserRoute = createRoute({
  method: 'post',
  path: '/users/{userId}/restore',
  tags: ['Admin - User Management'],
  summary: 'Restore deleted user',
  description: 'Restore soft-deleted user account (clears deleted_at timestamp and reactivates)',
  request: { params: userIdParamSchema },
  responses: {
    200: { description: 'User restored successfully', content: { 'application/json': { schema: userUpdateResponseSchema } } },
    404: { description: 'User not found or not deleted', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

export const forceKycStatusRoute = createRoute({
  method: 'patch',
  path: '/users/{userId}/kyc-status',
  tags: ['Admin - User Management'],
  summary: 'Force set KYC verification status (admin override)',
  description: 'Manually set KYC status without document review (use with caution)',
  request: {
    params: userIdParamSchema,
    body: { content: { 'application/json': { schema: forceKycStatusSchema } } },
  },
  responses: {
    200: {
      description: 'KYC status updated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              userId: z.string(),
              kycVerificationStatus: z.string(),
              onboardingStatus: z.string(),
            }),
            message: z.string(),
          }),
        },
      },
    },
    400: { description: 'Invalid request', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'User not found', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden - Admin access required', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
});

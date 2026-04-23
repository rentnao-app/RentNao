/**
 * Password reset routes
 * Password reset flow endpoints
 * 
 * Routes:
 *   POST /auth/password-reset/request  - Request password reset token
 *   POST /auth/password-reset/verify   - Verify reset token validity
 *   POST /auth/password-reset/confirm  - Confirm and reset password
 */

import { createRoute } from '@hono/zod-openapi';
import {
  passwordResetRequestSchema,
  passwordResetRequestResponseSchema,
  passwordResetVerifySchema,
  passwordResetVerifyResponseSchema,
  passwordResetConfirmSchema,
  passwordResetConfirmResponseSchema,
} from '../schemas';
import { commonErrors } from './helpers';

// ============================================================================
// POST /auth/password-reset/request
// ============================================================================

export const passwordResetRequestRoute = createRoute({
  method: 'post',
  path: '/password-reset/request',
  tags: ['Authentication'],
  summary: 'Request password reset',
  description: 'Request a password reset token to be sent via email or SMS. Does not reveal if account exists for security.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: passwordResetRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset request processed (always returns success for security)',
      content: {
        'application/json': {
          schema: passwordResetRequestResponseSchema,
        },
      },
    },
    ...commonErrors.badRequest,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// POST /auth/password-reset/verify
// ============================================================================

export const passwordResetVerifyRoute = createRoute({
  method: 'post',
  path: '/password-reset/verify',
  tags: ['Authentication'],
  summary: 'Verify password reset token',
  description: 'Verify that a password reset token is valid and not expired',
  request: {
    body: {
      content: {
        'application/json': {
          schema: passwordResetVerifySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Token is valid',
      content: {
        'application/json': {
          schema: passwordResetVerifyResponseSchema,
        },
      },
    },
    ...commonErrors.badRequest,
    ...commonErrors.gone,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// POST /auth/password-reset/confirm
// ============================================================================

export const passwordResetConfirmRoute = createRoute({
  method: 'post',
  path: '/password-reset/confirm',
  tags: ['Authentication'],
  summary: 'Confirm password reset',
  description: 'Reset password using valid token and new password. Invalidates all existing sessions.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: passwordResetConfirmSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Password reset successfully',
      content: {
        'application/json': {
          schema: passwordResetConfirmResponseSchema,
        },
      },
    },
    ...commonErrors.badRequest,
    ...commonErrors.gone,
    ...commonErrors.internalError,
  },
});

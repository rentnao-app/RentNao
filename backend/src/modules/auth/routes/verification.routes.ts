/**
 * Verification routes
 * Email and phone verification endpoints
 * 
 * Routes:
 *   POST /auth/verify-email         - Verify email with token
 *   POST /auth/verify-phone         - Verify phone with OTP
 *   POST /auth/resend-verification  - Resend verification token
 */

import { createRoute } from '@hono/zod-openapi';
import {
  verifyEmailSchema,
  verifyPhoneSchema,
  resendVerificationSchema,
  verificationResponseSchema,
  resendVerificationResponseSchema,
} from '../schemas';
import { commonErrors } from './helpers';

// ============================================================================
// POST /auth/verify-email
// ============================================================================

export const verifyEmailRoute = createRoute({
  method: 'post',
  path: '/verify-email',
  tags: ['Authentication'],
  summary: 'Verify email address',
  description: 'Verify user email address using the token sent via email',
  request: {
    body: {
      content: {
        'application/json': {
          schema: verifyEmailSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Email verified successfully',
      content: {
        'application/json': {
          schema: verificationResponseSchema,
        },
      },
    },
    ...commonErrors.badRequest,
    ...commonErrors.gone,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// POST /auth/verify-phone
// ============================================================================

export const verifyPhoneRoute = createRoute({
  method: 'post',
  path: '/verify-phone',
  tags: ['Authentication'],
  summary: 'Verify phone number',
  description: 'Verify user phone number using the OTP sent via SMS',
  request: {
    body: {
      content: {
        'application/json': {
          schema: verifyPhoneSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Phone verified successfully',
      content: {
        'application/json': {
          schema: verificationResponseSchema,
        },
      },
    },
    ...commonErrors.badRequest,
    ...commonErrors.gone,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// POST /auth/resend-verification
// ============================================================================

export const resendVerificationRoute = createRoute({
  method: 'post',
  path: '/resend-verification',
  tags: ['Authentication'],
  summary: 'Resend verification token',
  description: 'Resend verification token via email or SMS for unverified accounts',
  request: {
    body: {
      content: {
        'application/json': {
          schema: resendVerificationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Verification token sent successfully',
      content: {
        'application/json': {
          schema: resendVerificationResponseSchema,
        },
      },
    },
    ...commonErrors.badRequest,
    ...commonErrors.notFound,
    ...commonErrors.internalError,
  },
});

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
  startPhoneVerificationSchema,
  verificationResponseSchema,
  resendVerificationResponseSchema,
  startPhoneVerificationResponseSchema,
  pendingPhoneVerificationResponseSchema,
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
  security: [{ bearerAuth: [] }],
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
  summary: 'Resend verification token (email only)',
  description: 'Resend verification token via email for unverified accounts',
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
    ...commonErrors.tooManyRequests,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// POST /auth/phone/start
// ============================================================================

export const startPhoneVerificationRoute = createRoute({
  method: 'post',
  path: '/phone/start',
  tags: ['Authentication'],
  summary: 'Start authenticated phone verification',
  description: 'Attach a phone number to the current user (if needed) and send an OTP for verification',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: startPhoneVerificationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Verification OTP sent successfully',
      content: {
        'application/json': {
          schema: startPhoneVerificationResponseSchema,
        },
      },
    },
    ...commonErrors.badRequest,
    ...commonErrors.unauthorized,
    ...commonErrors.conflict,
    ...commonErrors.tooManyRequests,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// POST /auth/phone/change
// ============================================================================

export const changePhoneVerificationRoute = createRoute({
  method: 'post',
  path: '/phone/change',
  tags: ['Authentication'],
  summary: 'Change phone during verification',
  description: 'Replace the pending phone number and send a fresh OTP',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: startPhoneVerificationSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Verification OTP sent successfully',
      content: {
        'application/json': {
          schema: startPhoneVerificationResponseSchema,
        },
      },
    },
    ...commonErrors.badRequest,
    ...commonErrors.unauthorized,
    ...commonErrors.conflict,
    ...commonErrors.tooManyRequests,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// GET /auth/phone/pending
// ============================================================================

export const pendingPhoneVerificationRoute = createRoute({
  method: 'get',
  path: '/phone/pending',
  tags: ['Authentication'],
  summary: 'Get pending phone verification',
  description: 'Fetch pending phone verification state for the current user',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Pending phone verification state',
      content: {
        'application/json': {
          schema: pendingPhoneVerificationResponseSchema,
        },
      },
    },
    ...commonErrors.unauthorized,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// POST /auth/phone/resend
// ============================================================================

export const resendPhoneVerificationRoute = createRoute({
  method: 'post',
  path: '/phone/resend',
  tags: ['Authentication'],
  summary: 'Resend phone verification OTP',
  description: 'Resend OTP for the current pending phone verification',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Verification OTP sent successfully',
      content: {
        'application/json': {
          schema: startPhoneVerificationResponseSchema,
        },
      },
    },
    ...commonErrors.unauthorized,
    ...commonErrors.notFound,
    ...commonErrors.tooManyRequests,
    ...commonErrors.internalError,
  },
});

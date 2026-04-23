/**
 * Authentication route definitions (The Contract)
 * Only contains createRoute definitions - no implementation logic
 */

import { createRoute } from '@hono/zod-openapi';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
  resendVerificationSchema,
  registerResponseSchema,
  loginResponseSchema,
  verificationResponseSchema,
  resendVerificationResponseSchema,
  passwordResetRequestSchema,
  passwordResetVerifySchema,
  passwordResetConfirmSchema,
  passwordResetRequestResponseSchema,
  passwordResetVerifyResponseSchema,
  passwordResetConfirmResponseSchema,
  errorResponseSchema,
} from '../schemas';

// POST /auth/register
export const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  tags: ['Authentication'],
  summary: 'Register a new user',
  description: 'Create a new user account with email or phone number and password. Returns JWT tokens for immediate authentication.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User registered successfully',
      content: {
        'application/json': {
          schema: registerResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid request body or weak password',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: 'User with this identifier already exists',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/login
export const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Authentication'],
  summary: 'Login with credentials',
  description: 'Authenticate using email/phone and password. Returns JWT tokens for accessing protected resources.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: loginResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Invalid credentials or account not verified',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Account inactive or deleted',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/verify-email
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
    400: {
      description: 'Invalid token',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    410: {
      description: 'Token expired',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/verify-phone
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
    400: {
      description: 'Invalid OTP',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    410: {
      description: 'OTP expired',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/resend-verification
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
    400: {
      description: 'Account already verified or inactive',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'Account not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/password-reset/request
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
    400: {
      description: 'Invalid request body',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/password-reset/verify
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
    400: {
      description: 'Invalid token',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    410: {
      description: 'Token expired',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

// POST /auth/password-reset/confirm
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
    400: {
      description: 'Invalid token or password validation failed',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    410: {
      description: 'Token expired',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

/**
 * Authentication routes
 * User registration and login endpoints
 * 
 * Routes:
 *   POST /auth/register  - Register new user account
 *   POST /auth/login     - Login with credentials
 */

import { createRoute } from '@hono/zod-openapi';
import {
  registerSchema,
  registerResponseSchema,
  loginSchema,
  loginResponseSchema,
  logoutResponseSchema,
} from '../schemas';
import { commonErrors } from './helpers';

// ============================================================================
// POST /auth/register
// ============================================================================

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
    ...commonErrors.badRequest,
    ...commonErrors.conflict,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// POST /auth/login
// ============================================================================

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
    ...commonErrors.badRequest,
    ...commonErrors.unauthorized,
    ...commonErrors.forbidden,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// POST /auth/logout
// ============================================================================

export const logoutRoute = createRoute({
  method: 'post',
  path: '/logout',
  tags: ['Authentication'],
  summary: 'Logout current session',
  description: 'Invalidates the current access token by adding it to Redis blacklist.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Logout successful',
      content: {
        'application/json': {
          schema: logoutResponseSchema,
        },
      },
    },
    ...commonErrors.unauthorized,
    ...commonErrors.internalError,
  },
});

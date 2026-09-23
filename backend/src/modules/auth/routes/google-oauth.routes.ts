/**
 * Google OAuth routes
 * OpenAPI route definitions for Google OAuth endpoints
 *
 * Routes:
 *   GET  /auth/google           - Initiate Google OAuth flow (redirects to Google)
 *   GET  /auth/google/callback  - Handle Google redirect callback (redirects to frontend)
 *   POST /auth/google/exchange  - Exchange short-lived code for JWT tokens
 */

import { createRoute } from '@hono/zod-openapi';
import {
  googleInitiateQuerySchema,
  googleCallbackQuerySchema,
  googleExchangeSchema,
  googleExchangeResponseSchema,
} from '../schemas';
import { commonErrors } from './helpers';

// ============================================================================
// GET /auth/google
// ============================================================================

export const googleInitiateRoute = createRoute({
  method: 'get',
  path: '/google',
  tags: ['Google OAuth'],
  summary: 'Initiate Google OAuth flow',
  description:
    'Redirects the user to Google consent screen. After authentication, Google redirects back to /auth/google/callback.',
  request: {
    query: googleInitiateQuerySchema,
  },
  responses: {
    302: {
      description: 'Redirect to Google consent screen',
    },
    ...commonErrors.badRequest,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// GET /auth/google/callback
// ============================================================================

export const googleCallbackRoute = createRoute({
  method: 'get',
  path: '/google/callback',
  tags: ['Google OAuth'],
  summary: 'Google OAuth callback',
  description:
    'Handles the redirect from Google after user authentication. Exchanges the authorization code for tokens, resolves or creates the user, and redirects back to the frontend with a short-lived exchange code.',
  request: {
    query: googleCallbackQuerySchema,
  },
  responses: {
    302: {
      description: 'Redirect to frontend with exchange code or error',
    },
    ...commonErrors.badRequest,
    ...commonErrors.unauthorized,
    ...commonErrors.internalError,
  },
});

// ============================================================================
// POST /auth/google/exchange
// ============================================================================

export const googleExchangeRoute = createRoute({
  method: 'post',
  path: '/google/exchange',
  tags: ['Google OAuth'],
  summary: 'Exchange OAuth code for JWT tokens',
  description:
    'Exchanges the short-lived code received from the callback redirect for backend JWT access and refresh tokens.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: googleExchangeSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Token exchange successful',
      content: {
        'application/json': {
          schema: googleExchangeResponseSchema,
        },
      },
    },
    ...commonErrors.badRequest,
    ...commonErrors.unauthorized,
    ...commonErrors.internalError,
  },
});

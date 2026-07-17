/**
 * Google OAuth schemas
 * Request/response schemas for Google OAuth endpoints
 *
 * Endpoints:
 *   GET  /auth/google           - Initiate Google OAuth flow
 *   GET  /auth/google/callback  - Handle Google redirect callback
 *   POST /auth/google/exchange  - Exchange short-lived code for JWT tokens
 */

import { z } from '@hono/zod-openapi';
import { userSchema, tokensSchema } from './common.schemas';

// ============================================================================
// GET /auth/google — Query Parameters
// ============================================================================

export const googleInitiateQuerySchema = z.object({
  redirect_uri: z.string().url('redirect_uri must be a valid URL').openapi({
    example: 'http://localhost:5173/auth/callback',
    description: 'Frontend callback URL to redirect after OAuth completes',
  }),
  mode: z
    .enum(['login', 'signup'])
    .optional()
    .default('login')
    .openapi({
      example: 'login',
      description: 'OAuth mode: login to an existing account or signup a new one',
    }),
  role: z
    .string()
    .optional()
    .default('TENANT')
    .openapi({
      example: 'TENANT',
      description: 'Requested role when signing up (TENANT or OWNER)',
    }),
});

export type GoogleInitiateQuery = z.infer<typeof googleInitiateQuerySchema>;

// ============================================================================
// GET /auth/google/callback — Query Parameters
// ============================================================================

export const googleCallbackQuerySchema = z.object({
  code: z.string().optional().openapi({
    description: 'Authorization code returned by Google',
  }),
  state: z.string().optional().openapi({
    description: 'Signed JWT state token containing redirect_uri, mode, and role',
  }),
  error: z.string().optional().openapi({
    description: 'Error code returned by Google if the user denied access',
  }),
});

export type GoogleCallbackQuery = z.infer<typeof googleCallbackQuerySchema>;

// ============================================================================
// POST /auth/google/exchange — Request Body
// ============================================================================

export const googleExchangeSchema = z.object({
  code: z.string().min(1, 'Exchange code is required').openapi({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Short-lived exchange code received from the callback redirect',
  }),
});

export type GoogleExchangeInput = z.infer<typeof googleExchangeSchema>;

// ============================================================================
// POST /auth/google/exchange — Response
// ============================================================================

export const googleExchangeResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  accessToken: z.string().openapi({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  }),
  refreshToken: z.string().openapi({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token (30 days)',
  }),
  user: userSchema,
});

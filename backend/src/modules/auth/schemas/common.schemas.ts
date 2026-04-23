/**
 * Common/shared schemas used across auth endpoints
 * Reusable components for consistent API responses
 */

import { z } from '@hono/zod-openapi';
import { UserRole, OnboardingStatus } from '@/types/enums';

// ============================================================================
// Shared Response Components
// ============================================================================

export const userSchema = z.object({
  userId: z.string().openapi({ example: 'cm4abc123xyz' }),
  role: UserRole.openapi({ example: 'TENANT' }),
  onboardingStatus: OnboardingStatus.openapi({
    example: 'AUTH_PENDING',
  }),
  contactEmail: z.email().nullable().openapi({ example: 'user@example.com' }),
  contactPhone: z.string().nullable().openapi({ example: '+8801712345678' }),
  isActive: z.boolean().openapi({ example: true }),
  createdAt: z.string().datetime().openapi({ example: '2026-03-01T10:00:00Z' }),
});

export const tokensSchema = z.object({
  accessToken: z.string().openapi({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  }),
  refreshToken: z.string().openapi({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token (30 days)',
  }),
});

export const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string().openapi({ example: 'An account with this identifier already exists' }),
});

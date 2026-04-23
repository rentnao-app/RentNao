/**
 * Password reset schemas
 * Password reset flow request/response schemas
 */

import { z } from '@hono/zod-openapi';
import { IdentifierType } from '@/types/enums';
import { isValidEmail, isValidBDPhone, normalizeBDPhone } from '../utils/validators';

// ============================================================================
// Password Reset Request Schemas
// ============================================================================

export const passwordResetRequestSchema = z
  .object({
    identifier: z.string().trim().openapi({
      example: 'user@example.com',
      description: 'Email or phone number associated with the account',
    }),
    type: IdentifierType.openapi({
      example: 'EMAIL',
      description: 'Type of identifier',
    }),
  })
  .refine(
    (data) => {
      if (data.type === 'EMAIL') {
        return isValidEmail(data.identifier);
      }
      return true;
    },
    {
      message: 'Invalid email address format',
      path: ['identifier'],
    }
  )
  .refine(
    (data) => {
      if (data.type === 'PHONE') {
        return isValidBDPhone(data.identifier);
      }
      return true;
    },
    {
      message: 'Invalid Bangladesh phone number. Use format: +8801XXXXXXXXX, 8801XXXXXXXXX, or 01XXXXXXXXX',
      path: ['identifier'],
    }
  )
  .transform((data) => {
    if (data.type === 'PHONE') {
      data.identifier = normalizeBDPhone(data.identifier);
    }
    return data;
  });

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

export const passwordResetRequestResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    sent: z.boolean().openapi({ example: true }),
  }),
  message: z.string().openapi({
    example: 'Password reset instructions have been sent',
  }),
});

// ============================================================================
// Password Reset Verify Schemas
// ============================================================================

export const passwordResetVerifySchema = z.object({
  token: z.string().min(1, 'Token is required').openapi({
    example: 'abc123xyz789',
    description: 'Password reset token received via email/SMS',
  }),
});

export type PasswordResetVerifyInput = z.infer<typeof passwordResetVerifySchema>;

export const passwordResetVerifyResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    valid: z.boolean().openapi({ example: true }),
  }),
  message: z.string().openapi({
    example: 'Token is valid. You can now reset your password.',
  }),
});

// ============================================================================
// Password Reset Confirm Schemas
// ============================================================================

export const passwordResetConfirmSchema = z
  .object({
    token: z.string().min(1, 'Token is required').openapi({
      example: 'abc123xyz789',
      description: 'Password reset token',
    }),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .openapi({
        example: 'NewSecurePass123!',
        description: 'New password meeting complexity requirements',
      }),
    confirmPassword: z.string().openapi({
      example: 'NewSecurePass123!',
      description: 'Password confirmation (must match newPassword)',
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

export const passwordResetConfirmResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    reset: z.boolean().openapi({ example: true }),
  }),
  message: z.string().openapi({
    example: 'Password reset successfully. Please login with your new password.',
  }),
});

/**
 * Verification schemas
 * Email and phone verification request/response schemas
 */

import { z } from '@hono/zod-openapi';
import { IdentifierType } from '@/types/enums';
import { isValidEmail, isValidBDPhone, normalizeBDPhone } from '../utils/validators';

// ============================================================================
// Verify Email Schemas
// ============================================================================

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required').openapi({
    example: 'abc123xyz789',
    description: 'Email verification token received via email',
  }),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

// ============================================================================
// Verify Phone Schemas
// ============================================================================

export const verifyPhoneSchema = z.object({
  token: z.string().length(6, 'OTP must be 6 digits').openapi({
    example: '123456',
    description: '6-digit OTP received via SMS',
  }),
});

export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;

// ============================================================================
// Resend Verification Schemas
// ============================================================================

export const resendVerificationSchema = z
  .object({
    identifier: z.string().trim().openapi({
      example: 'user@example.com',
      description: 'Email or phone number to resend verification to',
    }),
    type: IdentifierType.openapi({
      example: 'EMAIL',
      description: 'Type of verification to resend',
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

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

// ============================================================================
// Start Phone Verification (Authenticated)
// ============================================================================

export const startPhoneVerificationSchema = z
  .object({
    phone: z.string().trim().openapi({
      example: '+8801712345678',
      description: 'Bangladesh phone number to bind and verify',
    }),
  })
  .refine((data) => isValidBDPhone(data.phone), {
    message: 'Invalid Bangladesh phone number. Use format: +8801XXXXXXXXX, 8801XXXXXXXXX, or 01XXXXXXXXX',
    path: ['phone'],
  })
  .transform((data) => ({
    phone: normalizeBDPhone(data.phone),
  }));

export type StartPhoneVerificationInput = z.infer<typeof startPhoneVerificationSchema>;

// ============================================================================
// Verification Response Schemas
// ============================================================================

export const verificationResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    verified: z.boolean().openapi({ example: true }),
  }),
  message: z.string().openapi({
    example: 'Email verified successfully. You can now complete your profile.',
  }),
});

export const resendVerificationResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    sent: z.boolean().openapi({ example: true }),
  }),
  message: z.string().openapi({
    example: 'Verification email sent successfully',
  }),
});

export const startPhoneVerificationResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    sent: z.boolean().openapi({ example: true }),
    phone: z.string().openapi({ example: '+8801712345678' }),
  }),
  message: z.string().openapi({
    example: 'Verification SMS sent successfully',
  }),
});

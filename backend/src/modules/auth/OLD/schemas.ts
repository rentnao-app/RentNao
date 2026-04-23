/**
 * Zod schemas for auth endpoints
 * Single source of truth for validation and OpenAPI documentation
 */

import { z } from '@hono/zod-openapi';
import {
  IdentifierType,
  VerificationTokenType,
  UserRole,
  OnboardingStatus,
  Verification,
} from '@/types/enums';
import { isValidEmail, isValidBDPhone, normalizeBDPhone } from '../utils/validators';

// ============================================================================
// Request Schemas
// ============================================================================

export const registerSchema = z
  .object({
    identifier: z.string().lowercase().trim().openapi({
      example: 'user@example.com',
      description: 'Email address or phone number',
    }),
    identifierType: IdentifierType.openapi({
      example: 'EMAIL',
      description: 'Type of identifier being used',
    }),
    role: UserRole.default('TENANT').openapi({
      example: 'TENANT',
      description: 'User role (defaults to TENANT if not specified)',
    }),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
    //Temp pass
    //   .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    //   .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    //   .regex(/\d/, 'Password must contain at least one number')
    //   .regex(
    //     /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    //     'Password must contain at least one special character'
    //   )
      .openapi({
        example: 'SecurePass123!',
        description: 'Strong password meeting complexity requirements',
      }),
    confirmPassword: z.string().openapi({
      example: 'SecurePass123!',
      description: 'Password confirmation (must match password)',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(
    (data) => {
      if (data.identifierType === 'EMAIL') {
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
      if (data.identifierType === 'PHONE') {
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
    if (data.identifierType === 'PHONE') {
      data.identifier = normalizeBDPhone(data.identifier);
    }
    return data;
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required').openapi({
    example: 'abc123xyz789',
    description: 'Email verification token received via email',
  }),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const verifyPhoneSchema = z.object({
  token: z.string().length(6, 'OTP must be 6 digits').openapi({
    example: '123456',
    description: '6-digit OTP received via SMS',
  }),
});

export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;

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

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, 'Identifier is required').openapi({
      example: 'user@example.com',
      description: 'Email or phone number',
    }),
    password: z.string().min(1, 'Password is required').openapi({
      example: 'SecurePass123!',
      description: 'Account password',
    }),
    rememberMe: z.boolean().optional().default(false).openapi({
      example: false,
      description: 'Extend session duration if true',
    }),
  })
  .transform((data) => {
    // Normalize phone number if it looks like one
    if (isValidBDPhone(data.identifier)) {
      data.identifier = normalizeBDPhone(data.identifier);
    }
    return data;
  });

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================================
// Response Schemas
// ============================================================================

export const userSchema = z.object({
  userId: z.string().openapi({ example: 'cm4abc123xyz' }),
  role: UserRole.openapi({ example: 'TENANT' }),
  onboardingStatus: OnboardingStatus.openapi({
    example: 'AUTH_PENDING',
  }),
  contactEmail: z.email().nullable().openapi({ example: 'user@example.com' }),
  contactPhone: z.string().nullable().openapi({ example: '+8801712345678' }),
  verificationStatus: Verification.openapi({ example: 'PENDING' }),
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

export const registerResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    user: userSchema,
    tokens: tokensSchema,
    needsVerification: z.boolean().openapi({
      example: true,
      description: 'Whether the user needs to verify their email/phone',
    }),
  }),
  message: z.string().openapi({
    example: 'Registration successful. Please verify your email to continue.',
  }),
});

export const verificationResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    verified: z.boolean().openapi({ example: true }),
  }),
  message: z.string().openapi({
    example: 'Email verified successfully. You can now complete your profile.',
  }),
});

export const loginResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    user: userSchema,
    tokens: tokensSchema,
  }),
  message: z.string().openapi({
    example: 'Login successful. Welcome back!',
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

// ============================================================================
// Password Reset Schemas
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

export const passwordResetVerifySchema = z.object({
  token: z.string().min(1, 'Token is required').openapi({
    example: 'abc123xyz789',
    description: 'Password reset token received via email/SMS',
  }),
});

export type PasswordResetVerifyInput = z.infer<typeof passwordResetVerifySchema>;

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

export const passwordResetRequestResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    sent: z.boolean().openapi({ example: true }),
  }),
  message: z.string().openapi({
    example: 'Password reset instructions have been sent',
  }),
});

export const passwordResetVerifyResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    valid: z.boolean().openapi({ example: true }),
  }),
  message: z.string().openapi({
    example: 'Token is valid. You can now reset your password.',
  }),
});

export const passwordResetConfirmResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    reset: z.boolean().openapi({ example: true }),
  }),
  message: z.string().openapi({
    example: 'Password reset successfully. Please login with your new password.',
  }),
});

export const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string().openapi({ example: 'An account with this identifier already exists' }),
});
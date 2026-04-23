/**
 * Authentication schemas
 * Registration and login request/response schemas
 */

import { z } from '@hono/zod-openapi';
import { IdentifierType, UserRole } from '@/types/enums';
import { isValidEmail, isValidBDPhone, normalizeBDPhone } from '../utils/validators';
import { userSchema, tokensSchema } from './common.schemas';

// ============================================================================
// Register Schemas
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

// ============================================================================
// Login Schemas
// ============================================================================

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

// ============================================================================
// Logout Schemas
// ============================================================================

export const logoutResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({
    example: 'Logout successful',
  }),
});

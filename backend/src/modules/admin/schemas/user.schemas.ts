import { z } from '@hono/zod-openapi';
import { UserRole, OnboardingStatus, IdentifierType, KycVerificationStatus } from '@/types/enums';
import { paginationQuerySchema } from './common.schemas';

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: UserRole.optional().openapi({
    example: 'TENANT',
    description: 'Filter by user role',
  }),
  onboardingStatus: OnboardingStatus.optional().openapi({
    example: 'COMPLETED',
    description: 'Filter by onboarding status',
  }),
  search: z.string().trim().optional().openapi({
    example: 'john',
    description: 'Search by email, phone, or name',
  }),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const updateOnboardingStatusSchema = z.object({
  onboardingStatus: OnboardingStatus.openapi({
    example: 'COMPLETED',
    description: 'New onboarding status',
  }),
});

export type UpdateOnboardingStatusInput = z.infer<typeof updateOnboardingStatusSchema>;

export const updateRoleSchema = z.object({
  role: UserRole.openapi({
    example: 'OWNER',
    description: 'New user role',
  }),
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const updateActiveStatusSchema = z.object({
  isActive: z.boolean().openapi({
    example: false,
    description: 'Active status',
  }),
});

export type UpdateActiveStatusInput = z.infer<typeof updateActiveStatusSchema>;

const userSummarySchema = z.object({
  userId: z.string(),
  role: UserRole,
  onboardingStatus: OnboardingStatus,
  contactEmail: z.string().email().nullable(),
  contactPhone: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

const credentialSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  identifierType: IdentifierType,
  verifiedAt: z.string().datetime().nullable(),
});

export const userListResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    users: z.array(userSummarySchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
});

export const userDetailResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    user: userSummarySchema.extend({
      lastLoginAt: z.string().datetime().nullable(),
    }),
    credentials: z.array(credentialSchema),
  }),
});

export const userUpdateResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    user: userSummarySchema,
  }),
  message: z.string().openapi({ example: 'User updated successfully' }),
});

export const forceKycStatusSchema = z.object({
  kycVerificationStatus: KycVerificationStatus.openapi({
    example: 'APPROVED',
    description: 'KYC status to set',
  }),
  reason: z.string().min(10).openapi({
    example: 'Manual override for testing',
    description: 'Reason for status change',
  }),
});

export type ForceKycStatusInput = z.infer<typeof forceKycStatusSchema>;
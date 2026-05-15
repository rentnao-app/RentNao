import { z } from '@hono/zod-openapi';
import { paginationQuerySchema, errorResponseSchema } from './common.schemas';
import { DiscountType, UserRole } from '@/types/enums';

export const discountPolicyIdParamSchema = z.object({
  discountPolicyId: z.string().min(1).openapi({
    param: { name: 'discountPolicyId', in: 'path' },
    example: 'cm4discount123xyz',
    description: 'Discount policy ID',
  }),
});

export const listDiscountPoliciesQuerySchema = paginationQuerySchema.extend({
  code: z.string().trim().optional().openapi({
    example: 'WELCOME10',
    description: 'Filter by discount code',
  }),
  feePolicyCode: z.string().trim().optional().openapi({
    example: 'LISTING_CREATE',
    description: 'Filter by fee policy code',
  }),
  isActive: z.coerce.boolean().optional().openapi({
    example: true,
    description: 'Filter by active status',
  }),
});

export type ListDiscountPoliciesQuery = z.infer<typeof listDiscountPoliciesQuerySchema>;

export const createDiscountPolicySchema = z.object({
  code: z.string().trim().min(2).max(100).openapi({
    example: 'WELCOME10',
    description: 'Discount code (unique)',
  }),
  feePolicyCode: z.string().trim().min(2).max(100).openapi({
    example: 'LISTING_CREATE',
    description: 'Fee policy code to match',
  }),
  discountType: DiscountType.openapi({
    example: 'PERCENTAGE',
    description: 'Discount type',
  }),
  fixedAmount: z.coerce.number().nonnegative().optional().openapi({
    example: 100,
    description: 'Fixed discount amount',
  }),
  percentage: z.coerce.number().nonnegative().optional().openapi({
    example: 10,
    description: 'Percentage discount value',
  }),
  minAmount: z.coerce.number().nonnegative().optional().openapi({
    example: 20,
    description: 'Minimum discount amount',
  }),
  maxAmount: z.coerce.number().nonnegative().optional().openapi({
    example: 500,
    description: 'Maximum discount amount',
  }),
  maxRedemptionsTotal: z.coerce.number().int().nonnegative().optional().openapi({
    example: 1000,
    description: 'Total redemption cap across all users',
  }),
  maxRedemptionsPerUser: z.coerce.number().int().nonnegative().optional().openapi({
    example: 2,
    description: 'Redemption cap per user',
  }),
  eligibleRole: UserRole.optional().openapi({
    example: 'TENANT',
    description: 'Limit eligibility to a role',
  }),
  effectiveFrom: z.string().datetime().openapi({
    example: '2026-05-01T00:00:00Z',
    description: 'Discount effective start timestamp',
  }),
  effectiveTo: z.string().datetime().nullable().optional().openapi({
    example: null,
    description: 'Optional discount effective end timestamp',
  }),
  isActive: z.boolean().optional().default(true).openapi({
    example: true,
    description: 'Whether this discount policy is active',
  }),
}).superRefine((body, ctx) => {
  if (body.discountType === 'FIXED') {
    if (typeof body.fixedAmount !== 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fixedAmount is required for FIXED discount type',
        path: ['fixedAmount'],
      });
    }
    if (typeof body.percentage === 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'percentage is not allowed for FIXED discount type',
        path: ['percentage'],
      });
    }
  }

  if (body.discountType === 'PERCENTAGE') {
    if (typeof body.percentage !== 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'percentage is required for PERCENTAGE discount type',
        path: ['percentage'],
      });
    }
    if (typeof body.fixedAmount === 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'fixedAmount is not allowed for PERCENTAGE discount type',
        path: ['fixedAmount'],
      });
    }
  }

  if (
    typeof body.minAmount === 'number' &&
    typeof body.maxAmount === 'number' &&
    body.minAmount > body.maxAmount
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'minAmount cannot be greater than maxAmount',
      path: ['minAmount'],
    });
  }

  if (body.effectiveTo && new Date(body.effectiveTo) <= new Date(body.effectiveFrom)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'effectiveTo must be later than effectiveFrom',
      path: ['effectiveTo'],
    });
  }
});

export type CreateDiscountPolicyInput = z.infer<typeof createDiscountPolicySchema>;

export const updateDiscountPolicySchema = z.object({
  code: z.string().trim().min(2).max(100).optional().openapi({
    example: 'WELCOME10',
    description: 'Discount code (unique)',
  }),
  feePolicyCode: z.string().trim().min(2).max(100).optional().openapi({
    example: 'LISTING_CREATE',
    description: 'Fee policy code to match',
  }),
  discountType: DiscountType.optional().openapi({
    example: 'FIXED',
    description: 'Discount type',
  }),
  fixedAmount: z.coerce.number().nonnegative().nullable().optional().openapi({
    example: 150,
    description: 'Fixed discount amount',
  }),
  percentage: z.coerce.number().nonnegative().nullable().optional().openapi({
    example: 15,
    description: 'Percentage discount value',
  }),
  minAmount: z.coerce.number().nonnegative().nullable().optional().openapi({
    example: 20,
    description: 'Minimum discount amount',
  }),
  maxAmount: z.coerce.number().nonnegative().nullable().optional().openapi({
    example: 500,
    description: 'Maximum discount amount',
  }),
  maxRedemptionsTotal: z.coerce.number().int().nonnegative().nullable().optional().openapi({
    example: 1000,
    description: 'Total redemption cap across all users',
  }),
  maxRedemptionsPerUser: z.coerce.number().int().nonnegative().nullable().optional().openapi({
    example: 2,
    description: 'Redemption cap per user',
  }),
  eligibleRole: UserRole.nullable().optional().openapi({
    example: 'TENANT',
    description: 'Limit eligibility to a role',
  }),
  effectiveFrom: z.string().datetime().optional().openapi({
    example: '2026-05-10T00:00:00Z',
    description: 'Discount effective start timestamp',
  }),
  effectiveTo: z.string().datetime().nullable().optional().openapi({
    example: null,
    description: 'Optional discount effective end timestamp',
  }),
  isActive: z.boolean().optional().openapi({
    example: false,
    description: 'Whether this discount policy is active',
  }),
}).superRefine((body, ctx) => {
  if (Object.keys(body).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field is required',
      path: [],
    });
  }

  if (
    typeof body.minAmount === 'number' &&
    typeof body.maxAmount === 'number' &&
    body.minAmount > body.maxAmount
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'minAmount cannot be greater than maxAmount',
      path: ['minAmount'],
    });
  }

  if (body.effectiveFrom && body.effectiveTo && new Date(body.effectiveTo) <= new Date(body.effectiveFrom)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'effectiveTo must be later than effectiveFrom',
      path: ['effectiveTo'],
    });
  }
});

export type UpdateDiscountPolicyInput = z.infer<typeof updateDiscountPolicySchema>;

const discountPolicySchema = z.object({
  id: z.string(),
  code: z.string(),
  feePolicyCode: z.string(),
  discountType: DiscountType,
  fixedAmount: z.string().nullable(),
  percentage: z.string().nullable(),
  minAmount: z.string().nullable(),
  maxAmount: z.string().nullable(),
  maxRedemptionsTotal: z.number().int().nullable(),
  maxRedemptionsPerUser: z.number().int().nullable(),
  eligibleRole: UserRole.nullable(),
  isActive: z.boolean(),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});

export const discountPolicyResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    discountPolicy: discountPolicySchema,
  }),
});

export const discountPolicyListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    discountPolicies: z.array(discountPolicySchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
});

export const discountPolicyMutationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    discountPolicy: discountPolicySchema,
  }),
  message: z.string(),
});

export const discountEligibleUsersResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    eligibleUsers: z.array(
      z.object({
        userId: z.string(),
        createdAt: z.string().datetime(),
      })
    ),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
});

export const updateEligibleUsersSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).openapi({
    example: ['cm4user123xyz', 'cm4user456xyz'],
    description: 'User IDs to add or remove',
  }),
});

export const updateEligibleUsersResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    discountPolicyId: z.string(),
    userIds: z.array(z.string()),
  }),
  message: z.string(),
});

export { errorResponseSchema };

import { z } from '@hono/zod-openapi';
import { paginationQuerySchema, errorResponseSchema } from './common.schemas';

export const feePolicyIdParamSchema = z.object({
  feePolicyId: z.string().min(1).openapi({
    param: { name: 'feePolicyId', in: 'path' },
    example: 'cm4policy123xyz',
    description: 'Fee policy ID',
  }),
});

export const listFeePoliciesQuerySchema = paginationQuerySchema.extend({
  code: z.string().trim().optional().openapi({
    example: 'LISTING_CREATE',
    description: 'Filter by fee code',
  }),
  isActive: z.coerce.boolean().optional().openapi({
    example: true,
    description: 'Filter by active status',
  }),
});

export type ListFeePoliciesQuery = z.infer<typeof listFeePoliciesQuerySchema>;

export const createFeePolicySchema = z.object({
  code: z.string().trim().min(2).max(100).openapi({
    example: 'LISTING_CREATE',
    description: 'Fee code (grouping key across versions)',
  }),
  name: z.string().trim().min(2).max(150).openapi({
    example: 'Listing creation fee',
    description: 'Human-readable fee policy name',
  }),
  currency: z.string().trim().length(3).default('BDT').openapi({
    example: 'BDT',
    description: 'Currency code',
  }),
  fixedAmount: z.coerce.number().nonnegative().optional().openapi({
    example: 500,
    description: 'Fixed fee component',
  }),
  percentage: z.coerce.number().nonnegative().optional().openapi({
    example: 2.5,
    description: 'Percentage fee component',
  }),
  percentBaseField: z.string().trim().min(1).max(50).optional().openapi({
    example: 'rent',
    description: 'Field key used to calculate percentage component',
  }),
  minAmount: z.coerce.number().nonnegative().optional().openapi({
    example: 100,
    description: 'Minimum final fee amount',
  }),
  maxAmount: z.coerce.number().nonnegative().optional().openapi({
    example: 5000,
    description: 'Maximum final fee amount',
  }),
  effectiveFrom: z.string().datetime().openapi({
    example: '2026-04-05T00:00:00Z',
    description: 'Policy effective start timestamp',
  }),
  effectiveTo: z.string().datetime().nullable().optional().openapi({
    example: null,
    description: 'Optional policy effective end timestamp',
  }),
  isActive: z.boolean().optional().default(true).openapi({
    example: true,
    description: 'Whether this policy is active',
  }),
}).superRefine((body, ctx) => {
  const hasFixed = typeof body.fixedAmount === 'number';
  const hasPercent = typeof body.percentage === 'number';

  if (!hasFixed && !hasPercent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one fee component is required: fixedAmount or percentage',
      path: ['fixedAmount'],
    });
  }

  if (hasPercent && !body.percentBaseField) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'percentBaseField is required when percentage is provided',
      path: ['percentBaseField'],
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
});

export type CreateFeePolicyInput = z.infer<typeof createFeePolicySchema>;

export const updateFeePolicySchema = z.object({
  name: z.string().trim().min(2).max(150).optional().openapi({
    example: 'Listing creation fee v2',
    description: 'Human-readable fee policy name',
  }),
  currency: z.string().trim().length(3).optional().openapi({
    example: 'BDT',
    description: 'Currency code',
  }),
  fixedAmount: z.coerce.number().nonnegative().nullable().optional().openapi({
    example: 600,
    description: 'Fixed fee component',
  }),
  percentage: z.coerce.number().nonnegative().nullable().optional().openapi({
    example: 2,
    description: 'Percentage fee component',
  }),
  percentBaseField: z.string().trim().min(1).max(50).nullable().optional().openapi({
    example: 'rent',
    description: 'Field key used to calculate percentage component',
  }),
  minAmount: z.coerce.number().nonnegative().nullable().optional().openapi({
    example: 100,
    description: 'Minimum final fee amount',
  }),
  maxAmount: z.coerce.number().nonnegative().nullable().optional().openapi({
    example: 5000,
    description: 'Maximum final fee amount',
  }),
  effectiveFrom: z.string().datetime().optional().openapi({
    example: '2026-04-10T00:00:00Z',
    description: 'Policy effective start timestamp',
  }),
  effectiveTo: z.string().datetime().nullable().optional().openapi({
    example: null,
    description: 'Optional policy effective end timestamp',
  }),
  isActive: z.boolean().optional().openapi({
    example: false,
    description: 'Whether this policy is active',
  }),
}).superRefine((body, ctx) => {
  if (Object.keys(body).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'At least one field is required',
      path: [],
    });
    return;
  }

  const nextPercentage = body.percentage;
  const nextPercentBase = body.percentBaseField;

  if (typeof nextPercentage === 'number' && nextPercentBase === null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'percentBaseField cannot be null when percentage is provided',
      path: ['percentBaseField'],
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
});

export type UpdateFeePolicyInput = z.infer<typeof updateFeePolicySchema>;

const feePolicySchema = z.object({
  id: z.string(),
  code: z.string(),
  version: z.number(),
  name: z.string(),
  currency: z.string(),
  fixedAmount: z.string().nullable(),
  percentage: z.string().nullable(),
  percentBaseField: z.string().nullable(),
  minAmount: z.string().nullable(),
  maxAmount: z.string().nullable(),
  isActive: z.boolean(),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().nullable(),
  createdBy: z.string().nullable(),
  createdAt: z.string().datetime(),
});

export const feePolicyResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    feePolicy: feePolicySchema,
  }),
});

export const feePolicyListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    feePolicies: z.array(feePolicySchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
});

export const feePolicyMutationResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    feePolicy: feePolicySchema,
  }),
  message: z.string(),
});

export { errorResponseSchema };

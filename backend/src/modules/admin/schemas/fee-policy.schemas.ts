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
  baseAmount: z.coerce.number().positive().openapi({
    example: 500,
    description: 'Base fee amount',
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
  baseAmount: z.coerce.number().positive().optional().openapi({
    example: 600,
    description: 'Base fee amount',
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
}).refine((body) => Object.keys(body).length > 0, {
  message: 'At least one field is required',
});

export type UpdateFeePolicyInput = z.infer<typeof updateFeePolicySchema>;

const feePolicySchema = z.object({
  id: z.string(),
  code: z.string(),
  version: z.number(),
  name: z.string(),
  currency: z.string(),
  baseAmount: z.string(),
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

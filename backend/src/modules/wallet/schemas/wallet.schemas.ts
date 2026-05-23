import { z } from '@hono/zod-openapi';
import {
  WalletStatus,
  WalletTxnDirection,
  WalletTxnType,
  WalletTxnStatus,
  TopupProvider,
  TopupStatus,
  ChargeStatus,
} from '@/types/enums';

// ============================================================================
// Wallet Account Schemas
// ============================================================================
description: 'Request completion timestamp',
  }),
});

export type WalletTopupRequestType = z.infer<typeof walletTopupRequestSchema>;

export const createTopupResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: walletTopupRequestSchema,
  message: z.string().openapi({ example: 'Topup request initiated' }),
});

export type CreateTopupResponseType = z.infer<typeof createTopupResponseSchema>;

export const bkashCallbackQuerySchema = z.object({
  paymentID: z.string().min(1).openapi({
    example: 'TR0011ABCDEF',
    description: 'bKash payment ID used for execute verification',
  }),
  status: z.string().optional().openapi({
    example: 'success',
    description: 'Optional callback status from bKash',
  }),
});

export type BKashCallbackQueryType = z.infer<typeof bkashCallbackQuerySchema>;

export const bkashCallbackResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: 'Webhook processed' }),
});

export type BKashCallbackResponseType = z.infer<typeof bkashCallbackResponseSchema>;

// ============================================================================
// Charge Schemas
// ============================================================================

export const chargeSchema = z.object({
  chargeId: z.string().openapi({
    example: 'cm4charge123xyz',
    description: 'Charge ID',
  }),
  userId: z.string().openapi({
    example: 'cm4user123xyz',
    description: 'User ID',
  }),
  feePolicyId: z.string().openapi({
    example: 'cm4policy123xyz',
    description: 'Fee policy ID',
  }),
  referenceType: z.string().openapi({
    example: 'LISTING',
    description: 'Type of charged activity (e.g., LISTING)',
  }),
  referenceId: z.string().openapi({
    example: 'cm4listing123xyz',
    description: 'ID of the charged resource',
  }),
  baseAmount: z.string().openapi({
    example: '500.00',
    description: 'Base charge amount as decimal string',
  }),
  finalAmount: z.string().openapi({
    example: '500.00',
    description: 'Final charge amount (after adjustments) as decimal string',
  }),
  currency: z.string().openapi({
    example: 'BDT',
    description: 'Currency code',
  }),
  status: ChargeStatus.openapi({
    example: 'PENDING',
    description: 'Charge status',
  }),
  failureReason: z.string().nullable().openapi({
    example: 'Insufficient balance',
    description: 'Reason for failure if status is FAILED',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2026-04-03T12:00:00Z',
    description: 'Charge creation timestamp',
  }),
  settledAt: z.string().datetime().nullable().openapi({
    example: '2026-04-03T12:05:00Z',
    description: 'Settlement timestamp',
  }),
});

export type ChargeType = z.infer<typeof chargeSchema>;

export const chargesResponseSchema = z.object({
  charges: z.array(chargeSchema),
  pagination: z.object({
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
    total: z.number().openapi({ example: 5 }),
    totalPages: z.number().openapi({ example: 1 }),
  }),
});

export type ChargesResponseType = z.infer<typeof chargesResponseSchema>;

// ============================================================================
// Fee Policy Schemas
// ============================================================================

export const feePolicyCodeParamSchema = z.object({
  feeCode: z
    .string()
    .min(1)
    .openapi({
      param: { name: 'feeCode', in: 'path' },
      example: 'LISTING_UNLOCK',
      description: 'Fee policy code',
    }),
});

export const activeFeePolicySchema = z.object({
  code: z.string().openapi({
    example: 'LISTING_UNLOCK',
    description: 'Fee policy code',
  }),
  name: z.string().openapi({
    example: 'Listing Unlock Fee',
    description: 'Fee policy display name',
  }),
  amount: z.string().openapi({
    example: '50.00',
    description: 'Required payment amount as decimal string',
  }),
  currency: z.string().openapi({
    example: 'BDT',
    description: 'Currency code',
  }),
});

export type ActiveFeePolicyType = z.infer<typeof activeFeePolicySchema>;

// ============================================================================
// Error Response Schema
// ============================================================================

export const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string(),
});
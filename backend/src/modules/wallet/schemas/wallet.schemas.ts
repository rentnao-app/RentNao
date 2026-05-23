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

export const walletAccountSchema = z.object({
  walletId: z.string().openapi({
    example: 'cm4wallet123xyz',
    description: 'Wallet account ID',
  }),
  userId: z.string().openapi({
    example: 'cm4user123xyz',
    description: 'User ID',
  }),
  status: WalletStatus.openapi({
    example: 'ACTIVE',
    description: 'Wallet status',
  }),
  currency: z.string().openapi({
    example: 'BDT',
    description: 'Currency code',
  }),
  availableBalance: z.string().openapi({
    example: '5000.00',
    description: 'Available balance as decimal string',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2026-04-03T12:00:00Z',
    description: 'Wallet creation timestamp',
  }),
  updatedAt: z.string().datetime().nullable().openapi({
    example: '2026-04-03T13:00:00Z',
    description: 'Last update timestamp',
  }),
});

export type WalletAccountType = z.infer<typeof walletAccountSchema>;

// ============================================================================
// Wallet Transaction Schemas
// ============================================================================

export const walletTransactionSchema = z.object({
  transactionId: z.string().openapi({
    example: 'cm4txn123xyz',
    description: 'Transaction ID',
  }),
  direction: WalletTxnDirection.openapi({
    example: 'CREDIT',
    description: 'Transaction direction (CREDIT/DEBIT)',
  }),
  type: WalletTxnType.openapi({
    example: 'LISTING_FEE',
    description: 'Transaction type',
  }),
  status: WalletTxnStatus.openapi({
    example: 'POSTED',
    description: 'Transaction status',
  }),
  amount: z.string().openapi({
    example: '5000.00',
    description: 'Transaction amount as decimal string',
  }),
  currency: z.string().openapi({
    example: 'BDT',
    description: 'Currency code',
  }),
  description: z.string().nullable().openapi({
    example: 'Listing fee debit',
    description: 'Transaction description',
  }),
  referenceType: z.string().nullable().openapi({
    example: 'LISTING',
    description: 'Type of referenced record (e.g., LISTING, CHARGE)',
  }),
  referenceId: z.string().nullable().openapi({
    example: 'cm4listing123xyz',
    description: 'ID of the referenced record',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2026-04-03T12:30:00Z',
    description: 'Transaction creation timestamp',
  }),
  postedAt: z.string().datetime().nullable().openapi({
    example: '2026-04-03T12:31:00Z',
    description: 'Post timestamp (when transaction settled)',
  }),
});

export type WalletTransactionType = z.infer<typeof walletTransactionSchema>;

export const walletTransactionsResponseSchema = z.object({
  transactions: z.array(walletTransactionSchema),
  pagination: z.object({
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
    total: z.number().openapi({ example: 150 }),
    totalPages: z.number().openapi({ example: 8 }),
  }),
});

export type WalletTransactionsResponseType = z.infer<typeof walletTransactionsResponseSchema>;

// ============================================================================
// Topup Request Schemas
// ============================================================================

export const createTopupRequestSchema = z.object({
  amount: z.number().positive().openapi({
    example: 500,
    description: 'Topup amount in major units (BDT)',
  }),
  provider: TopupProvider.openapi({
    example: 'BKASH',
    description: 'Payment provider',
  }),
});

export type CreateTopupRequestInput = z.infer<typeof createTopupRequestSchema>;

export const walletTopupRequestSchema = z.object({
  topupId: z.string().openapi({
    example: 'cm4topup123xyz',
    description: 'Topup request ID',
  }),
  status: TopupStatus.openapi({
    example: 'SUCCESS',
    description: 'Topup request status',
  }),
  requestedAmount: z.string().openapi({
    example: '500.00',
    description: 'Requested amount as decimal string',
  }),
  currency: z.string().openapi({
    example: 'BDT',
    description: 'Currency code',
  }),
  provider: TopupProvider.openapi({
    example: 'BKASH',
    description: 'Payment provider',
  }),
  externalRequestId: z.string().openapi({
    example: 'user123_1710000000000_abc',
    description: 'Internal request reference',
  }),
  externalPaymentId: z.string().nullable().openapi({
    example: 'TR0011ABCDEF',
    description: 'Provider payment ID',
  }),
  externalTrxId: z.string().nullable().openapi({
    example: '8A7B6C5D4E',
    description: 'Provider transaction ID',
  }),
  failureReason: z.string().nullable().openapi({
    example: 'Payment not completed',
    description: 'Failure reason when status is FAILED',
  }),
  expiresAt: z.string().datetime().openapi({
    example: '2026-04-03T12:15:00Z',
    description: 'Request expiry timestamp',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2026-04-03T12:00:00Z',
    description: 'Request creation timestamp',
  }),
  completedAt: z.string().datetime().nullable().openapi({
    example: '2026-04-03T12:05:00Z',
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

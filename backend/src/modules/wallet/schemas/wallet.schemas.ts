import { z } from '@hono/zod-openapi';
import { WalletStatus, WalletTxnDirection, WalletTxnType, WalletTxnStatus, TopupProvider, TopupStatus, ChargeStatus } from '@/types/enums';

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
    example: 'TOPUP',
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
    example: 'bKash topup',
    description: 'Transaction description',
  }),
  referenceType: z.string().nullable().openapi({
    example: 'TOPUP_REQUEST',
    description: 'Type of referenced record (e.g., TOPUP_REQUEST, LISTING, CHARGE)',
  }),
  referenceId: z.string().nullable().openapi({
    example: 'cm4topup123xyz',
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
  amount: z
    .string()
    .or(z.number())
    .transform((val) => {
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        if (isNaN(parsed) || parsed <= 0) throw new Error('Invalid amount');
        return parsed;
      }
      if (val <= 0) throw new Error('Amount must be positive');
      return val;
    })
    .openapi({
      example: 500,
      description: 'Topup amount (minimum as per policy)',
    }),
  provider: TopupProvider.default('BKASH').openapi({
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
    example: 'PENDING',
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
    example: 'bkash_req_12345',
    description: 'Provider request ID (for reconciliation)',
  }),
  externalPaymentId: z.string().nullable().openapi({
    example: 'bkash_pay_67890',
    description: 'Provider payment ID (after user pays)',
  }),
  externalTrxId: z.string().nullable().openapi({
    example: 'bkash_trx_abcde',
    description: 'Provider transaction ID (after settlement)',
  }),
  failureReason: z.string().nullable().openapi({
    example: 'User cancelled payment',
    description: 'Reason for failure if status is FAILED',
  }),
  expiresAt: z.string().datetime().nullable().openapi({
    example: '2026-04-03T13:30:00Z',
    description: 'Payment expiry timestamp',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2026-04-03T12:30:00Z',
    description: 'Request creation timestamp',
  }),
  completedAt: z.string().datetime().nullable().openapi({
    example: '2026-04-03T12:35:00Z',
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
// Error Response Schema
// ============================================================================

export const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string(),
});

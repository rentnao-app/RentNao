import { z } from '@hono/zod-openapi';
import { WalletStatus, WalletTxnDirection, WalletTxnType, WalletTxnStatus, ChargeStatus, TopupRequestStatus } from '@/types/enums';

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
// Topup Request Schemas
// ============================================================================

export const createTopupRequestSchema = z.object({
  amount: z.number().positive().openapi({
    example: 5000,
    description: 'Topup amount in major units (BDT)',
  }),
  bkashNumber: z.string().length(11).openapi({
    example: '01712345678',
    description: 'bKash number (11 digits)',
  }),
  transactionId: z.string().min(1).openapi({
    example: 'txn_abc123def456',
    description: 'bKash transaction ID from payment receipt',
  }),
});

export type CreateTopupRequestType = z.infer<typeof createTopupRequestSchema>;

export const topupRequestSchema = z.object({
  topupRequestId: z.string().openapi({
    example: 'cm4topup123xyz',
    description: 'Topup request ID',
  }),
  userId: z.string().openapi({
    example: 'cm4user123xyz',
    description: 'User ID',
  }),
  amount: z.string().openapi({
    example: '5000.00',
    description: 'Topup amount as decimal string',
  }),
  bkashNumber: z.string().openapi({
    example: '01712345678',
    description: 'bKash number',
  }),
  transactionId: z.string().openapi({
    example: 'txn_abc123def456',
    description: 'bKash transaction ID',
  }),
  status: TopupRequestStatus.openapi({
    example: 'PENDING',
    description: 'Topup request status',
  }),
  rejectionReason: z.string().nullable().openapi({
    example: 'Transaction ID not found on bKash',
    description: 'Reason for rejection if status is REJECTED',
  }),
  approvedAt: z.string().datetime().nullable().openapi({
    example: '2026-04-03T14:00:00Z',
    description: 'Approval timestamp',
  }),
  createdAt: z.string().datetime().openapi({
    example: '2026-04-03T12:00:00Z',
    description: 'Request creation timestamp',
  }),
});

export type TopupRequestType = z.infer<typeof topupRequestSchema>;

export const topupRequestsListResponseSchema = z.object({
  topupRequests: z.array(topupRequestSchema),
  pagination: z.object({
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
    total: z.number().openapi({ example: 15 }),
    totalPages: z.number().openapi({ example: 1 }),
  }),
});

export type TopupRequestsListResponseType = z.infer<typeof topupRequestsListResponseSchema>;

export const approveTopupRequestSchema = z.object({
  topupRequestId: z.string().openapi({
    example: 'cm4topup123xyz',
    description: 'Topup request ID to approve',
  }),
});

export type ApproveTopupRequestType = z.infer<typeof approveTopupRequestSchema>;

export const rejectTopupRequestSchema = z.object({
  topupRequestId: z.string().openapi({
    example: 'cm4topup123xyz',
    description: 'Topup request ID to reject',
  }),
  rejectionReason: z.string().min(1).openapi({
    example: 'Transaction ID not verified',
    description: 'Reason for rejection',
  }),
});

export type RejectTopupRequestType = z.infer<typeof rejectTopupRequestSchema>;

// ============================================================================
// Error Response Schema
// ============================================================================

export const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string(),
});

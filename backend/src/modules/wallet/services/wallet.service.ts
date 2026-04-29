/**
 * Wallet service
 * Handles wallet account, transactions, and charges
 */

import { db } from '@/db/client';
import { AppError } from '@/errors/base';
import type { WalletAccountType, WalletTransactionType, ChargeType, TopupRequestType } from '../schemas';

function createId() {
  return crypto.randomUUID();
}

type Queryable = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

export interface PaidActionInput {
  userId: string;
  feeCode: string;
  referenceType: string;
  referenceId: string;
  walletTxnType: 'LISTING_FEE' | 'REFUND' | 'ADJUSTMENT' | 'REVERSAL';
  description?: string;
  referenceData?: Record<string, number>; // e.g., { rent: 10000 } to calculate percentage on
}

export interface PaidActionResult {
  chargeId: string;
  walletTransactionId: string;
  debitedAmount: string;
  currency: string;
}

/**
 * Calculate final fee amount from flexible fee policy
 * Supports fixed amount, percentage (of reference field), min/max bounds
 */
function calculateFeeAmount(
  feePolicy: any,
  referenceData?: Record<string, number>
): number {
  let amount = 0;

  // Add fixed component
  if (feePolicy.fixed_amount) {
    amount += Number(feePolicy.fixed_amount);
  }

  // Add percentage component
  if (feePolicy.percentage && feePolicy.percent_base_field && referenceData) {
    const baseValue = referenceData[feePolicy.percent_base_field];
    if (baseValue !== undefined) {
      amount += (baseValue * Number(feePolicy.percentage)) / 100;
    }
  }

  // Apply min/max bounds
  if (feePolicy.min_amount && amount < Number(feePolicy.min_amount)) {
    amount = Number(feePolicy.min_amount);
  }
  if (feePolicy.max_amount && amount > Number(feePolicy.max_amount)) {
    amount = Number(feePolicy.max_amount);
  }

  return amount;
}

/**
 * Assert payment requirement and debit wallet in a transaction-safe way.
 * Caller must provide the same DB client/transaction context used by the business write.
 */
export async function assertPaidActionAndDebit(
  client: Queryable,
  input: PaidActionInput
): Promise<PaidActionResult> {
  const feePolicyResult = await client.query(
    `SELECT id, code, currency, fixed_amount, percentage, percent_base_field, min_amount, max_amount
     FROM "FeePolicy"
     WHERE code = $1
       AND is_active = true
       AND effective_from <= NOW()
       AND (effective_to IS NULL OR effective_to > NOW())
     ORDER BY version DESC
     LIMIT 1`,
    [input.feeCode]
  );

  if (feePolicyResult.rows.length === 0) {
    throw new AppError(409, `Fee policy not configured for code: ${input.feeCode}`);
  }

  const feePolicy = feePolicyResult.rows[0];
  const requiredAmount = calculateFeeAmount(feePolicy, input.referenceData);

  if (requiredAmount <= 0) {
    throw new AppError(400, `Fee policy ${input.feeCode} does not calculate a valid amount`);
  }

  const walletResult = await client.query(
    `SELECT id, status, currency, available_balance
     FROM "WalletAccount"
     WHERE user_id = $1
     FOR UPDATE`,
    [input.userId]
  );

  if (walletResult.rows.length === 0) {
    throw new AppError(404, 'Wallet not found');
  }

  const wallet = walletResult.rows[0];
  if (wallet.status !== 'ACTIVE') {
    throw new AppError(403, 'Wallet is not active');
  }

  if (wallet.currency !== feePolicy.currency) {
    throw new AppError(409, 'Wallet currency does not match fee currency');
  }

  const availableBalance = Number(wallet.available_balance);
  if (availableBalance < requiredAmount) {
    throw new AppError(
      402,
      `Payment required for ${input.feeCode}`,
      true,
      {
        code: 'PAYMENT_REQUIRED',
        feeCode: input.feeCode,
        requiredAmount: requiredAmount.toFixed(2),
        availableBalance: availableBalance.toFixed(2),
        currency: feePolicy.currency,
      }
    );
  }

  const chargeId = createId();
  await client.query(
    `INSERT INTO "Charge" (
      id, user_id, fee_policy_id, reference_type, reference_id,
      currency, base_amount, final_amount, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW())`,
    [
      chargeId,
      input.userId,
      feePolicy.id,
      input.referenceType,
      input.referenceId,
      feePolicy.currency,
      requiredAmount,
      requiredAmount,
    ]
  );

  await client.query(
    `UPDATE "WalletAccount"
     SET available_balance = available_balance - $1,
         updated_at = NOW()
     WHERE id = $2`,
    [requiredAmount, wallet.id]
  );

  const walletTransactionId = createId();
  await client.query(
    `INSERT INTO "WalletTransaction" (
      id, wallet_account_id, direction, type, status,
      amount, currency, description, reference_type, reference_id,
      created_at, posted_at
    ) VALUES (
      $1, $2, 'DEBIT', $3, 'POSTED',
      $4, $5, $6, $7, $8,
      NOW(), NOW()
    )`,
    [
      walletTransactionId,
      wallet.id,
      input.walletTxnType,
      requiredAmount,
      feePolicy.currency,
      input.description || `Charge applied for ${input.feeCode}`,
      input.referenceType,
      input.referenceId,
    ]
  );

  await client.query(
    `UPDATE "Charge"
     SET status = 'SETTLED', settled_at = NOW(), updated_at = NOW()
     WHERE id = $1`,
    [chargeId]
  );

  return {
    chargeId,
    walletTransactionId,
    debitedAmount: requiredAmount.toFixed(2),
    currency: feePolicy.currency,
  };
}

/**
 * Get wallet account for a user
 */
export async function getWalletAccount(userId: string): Promise<WalletAccountType> {
  const result = await db.query(
    `SELECT 
      id as wallet_id,
      user_id,
      status,
      currency,
      available_balance,
      created_at,
      updated_at
     FROM "WalletAccount"
     WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Wallet not found');
  }

  const wallet = result.rows[0];
  return {
    walletId: wallet.wallet_id,
    userId: wallet.user_id,
    status: wallet.status,
    currency: wallet.currency,
    availableBalance: wallet.available_balance.toString(),
    createdAt: wallet.created_at.toISOString(),
    updatedAt: wallet.updated_at?.toISOString() || null,
  };
}

/**
 * Get wallet transactions (paginated)
 */
export async function getWalletTransactions(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  transactions: WalletTransactionType[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  // Get wallet ID
  const walletResult = await db.query(
    `SELECT id FROM "WalletAccount" WHERE user_id = $1`,
    [userId]
  );

  if (walletResult.rows.length === 0) {
    throw new AppError(404, 'Wallet not found');
  }

  const walletId = walletResult.rows[0].id;

  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as count FROM "WalletTransaction" WHERE wallet_account_id = $1`,
    [walletId]
  );

  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (page - 1) * limit;

  // Get transactions
  const result = await db.query(
    `SELECT 
      id as transaction_id,
      direction,
      type,
      status,
      amount,
      currency,
      description,
      reference_type,
      reference_id,
      created_at,
      posted_at
     FROM "WalletTransaction"
     WHERE wallet_account_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [walletId, limit, offset]
  );

  const transactions: WalletTransactionType[] = result.rows.map((row) => ({
    transactionId: row.transaction_id,
    direction: row.direction,
    type: row.type,
    status: row.status,
    amount: row.amount.toString(),
    currency: row.currency,
    description: row.description,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    createdAt: row.created_at.toISOString(),
    postedAt: row.posted_at?.toISOString() || null,
  }));

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}


/**
 * Get user charges (paginated)
 */
export async function getUserCharges(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  charges: ChargeType[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as count FROM "Charge" WHERE user_id = $1`,
    [userId]
  );

  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (page - 1) * limit;

  // Get charges
  const result = await db.query(
    `SELECT 
      id as charge_id,
      user_id,
      fee_policy_id,
      reference_type,
      reference_id,
      base_amount,
      final_amount,
      currency,
      status,
      failure_reason,
      created_at,
      settled_at
     FROM "Charge"
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const charges: ChargeType[] = result.rows.map((row) => ({
    chargeId: row.charge_id,
    userId: row.user_id,
    feePolicyId: row.fee_policy_id,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    baseAmount: row.base_amount.toString(),
    finalAmount: row.final_amount.toString(),
    currency: row.currency,
    status: row.status,
    failureReason: row.failure_reason,
    createdAt: row.created_at.toISOString(),
    settledAt: row.settled_at?.toISOString() || null,
  }));

  return {
    charges,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Create a topup request (user submits request with amount, bKash number, and transaction ID)
 */
export async function createTopupRequest(
  userId: string,
  amount: number,
  bkashNumber: string,
  transactionId: string
): Promise<TopupRequestType> {
  // Get wallet account
  const walletResult = await db.query(
    `SELECT id FROM "WalletAccount" WHERE user_id = $1`,
    [userId]
  );

  if (walletResult.rows.length === 0) {
    throw new AppError(404, 'Wallet not found');
  }

  const walletId = walletResult.rows[0].id;

  // Check if transaction ID already exists for this user
  const existingResult = await db.query(
    `SELECT id FROM "TopupRequest" WHERE user_id = $1 AND transaction_id = $2`,
    [userId, transactionId]
  );

  if (existingResult.rows.length > 0) {
    throw new AppError(409, 'Topup request with this transaction ID already exists');
  }

  const topupRequestId = crypto.randomUUID();

  // Create topup request
  await db.query(
    `INSERT INTO "TopupRequest" (
      id, user_id, wallet_account_id, amount, bkash_number, transaction_id, status, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', NOW())`,
    [topupRequestId, userId, walletId, amount, bkashNumber, transactionId]
  );

  // Retrieve created request
  const result = await db.query(
    `SELECT 
      id as topup_request_id,
      user_id,
      amount,
      bkash_number,
      transaction_id,
      status,
      rejection_reason,
      approved_at,
      created_at
     FROM "TopupRequest"
     WHERE id = $1`,
    [topupRequestId]
  );

  const row = result.rows[0];
  return {
    topupRequestId: row.topup_request_id,
    userId: row.user_id,
    amount: row.amount.toString(),
    bkashNumber: row.bkash_number,
    transactionId: row.transaction_id,
    status: row.status,
    rejectionReason: row.rejection_reason,
    approvedAt: row.approved_at?.toISOString() || null,
    createdAt: row.created_at.toISOString(),
  };
}

/**
 * Get user's topup requests
 */
export async function getUserTopupRequests(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  topupRequests: TopupRequestType[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  // Get total count
  const countResult = await db.query(
    `SELECT COUNT(*) as count FROM "TopupRequest" WHERE user_id = $1`,
    [userId]
  );

  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (page - 1) * limit;

  // Get topup requests
  const result = await db.query(
    `SELECT 
      id as topup_request_id,
      user_id,
      amount,
      bkash_number,
      transaction_id,
      status,
      rejection_reason,
      approved_at,
      created_at
     FROM "TopupRequest"
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const topupRequests: TopupRequestType[] = result.rows.map((row) => ({
    topupRequestId: row.topup_request_id,
    userId: row.user_id,
    amount: row.amount.toString(),
    bkashNumber: row.bkash_number,
    transactionId: row.transaction_id,
    status: row.status,
    rejectionReason: row.rejection_reason,
    approvedAt: row.approved_at?.toISOString() || null,
    createdAt: row.created_at.toISOString(),
  }));

  return {
    topupRequests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get topup requests for admin (paginated, optionally filtered by status)
 */
export async function getAdminTopupRequests(
  status?: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  topupRequests: TopupRequestType[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  let countQuery = `SELECT COUNT(*) as count FROM "TopupRequest"`;
  let dataQuery = `SELECT 
      id as topup_request_id,
      user_id,
      amount,
      bkash_number,
      transaction_id,
      status,
      rejection_reason,
      approved_at,
      created_at
     FROM "TopupRequest"`;

  const params: any[] = [];

  if (status) {
    countQuery += ` WHERE status = $1`;
    dataQuery += ` WHERE status = $1`;
    params.push(status);
  }

  // Get total count
  const countResult = await db.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count, 10);
  const offset = (page - 1) * limit;

  // Get topup requests
  dataQuery += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  const result = await db.query(dataQuery, [...params, limit, offset]);

  const topupRequests: TopupRequestType[] = result.rows.map((row) => ({
    topupRequestId: row.topup_request_id,
    userId: row.user_id,
    amount: row.amount.toString(),
    bkashNumber: row.bkash_number,
    transactionId: row.transaction_id,
    status: row.status,
    rejectionReason: row.rejection_reason,
    approvedAt: row.approved_at?.toISOString() || null,
    createdAt: row.created_at.toISOString(),
  }));

  return {
    topupRequests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Approve topup request and credit wallet
 */
export async function approveTopupRequest(
  topupRequestId: string,
  approvedByAdminId: string
): Promise<{ topupRequestId: string; walletTransactionId: string; creditedAmount: string }> {
  // Get topup request
  const topupResult = await db.query(
    `SELECT user_id, wallet_account_id, amount FROM "TopupRequest" WHERE id = $1 AND status = 'PENDING'`,
    [topupRequestId]
  );

  if (topupResult.rows.length === 0) {
    throw new AppError(404, 'Topup request not found or already processed');
  }

  const topupRequest = topupResult.rows[0];

  // Credit wallet in transaction-safe way
  const walletResult = await db.query(
    `SELECT id, status, currency, available_balance FROM "WalletAccount" WHERE id = $1 FOR UPDATE`,
    [topupRequest.wallet_account_id]
  );

  if (walletResult.rows.length === 0) {
    throw new AppError(404, 'Wallet not found');
  }

  const wallet = walletResult.rows[0];

  if (wallet.status !== 'ACTIVE') {
    throw new AppError(403, 'Wallet is not active');
  }

  // Update wallet balance
  await db.query(
    `UPDATE "WalletAccount" SET available_balance = available_balance + $1, updated_at = NOW() WHERE id = $2`,
    [topupRequest.amount, wallet.id]
  );

  // Create wallet transaction (CREDIT)
  const walletTransactionId = crypto.randomUUID();
  await db.query(
    `INSERT INTO "WalletTransaction" (
      id, wallet_account_id, direction, type, status, amount, currency, description, reference_type, reference_id, created_at, posted_at
    ) VALUES ($1, $2, 'CREDIT', 'TOPUP', 'POSTED', $3, $4, $5, 'TOPUP_REQUEST', $6, NOW(), NOW())`,
    [
      walletTransactionId,
      wallet.id,
      topupRequest.amount,
      wallet.currency,
      `Topup approved - Transaction ${topupRequestId}`,
      topupRequestId,
    ]
  );

  // Update topup request status
  await db.query(
    `UPDATE "TopupRequest" SET status = 'APPROVED', approved_at = NOW(), approved_by_admin_id = $1, updated_at = NOW() WHERE id = $2`,
    [approvedByAdminId, topupRequestId]
  );

  return {
    topupRequestId,
    walletTransactionId,
    creditedAmount: topupRequest.amount.toString(),
  };
}

/**
 * Reject topup request
 */
export async function rejectTopupRequest(
  topupRequestId: string,
  rejectionReason: string
): Promise<{ topupRequestId: string }> {
  // Get topup request
  const topupResult = await db.query(
    `SELECT id, status FROM "TopupRequest" WHERE id = $1`,
    [topupRequestId]
  );

  if (topupResult.rows.length === 0) {
    throw new AppError(404, 'Topup request not found');
  }

  const topup = topupResult.rows[0];

  if (topup.status !== 'PENDING') {
    throw new AppError(409, 'Topup request has already been processed');
  }

  // Update topup request status
  await db.query(
    `UPDATE "TopupRequest" SET status = 'REJECTED', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
    [rejectionReason, topupRequestId]
  );

  return { topupRequestId };
}


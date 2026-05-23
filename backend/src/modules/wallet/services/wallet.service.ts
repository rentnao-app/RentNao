/**
 * Wallet service
 * Handles wallet account, transactions, topups, and charges
 */

import { db } from '@/db/client';
import { AppError } from '@/errors/base';
import { createPaymentIntent, executePayment, queryPayment } from './bkash.service';
import type {
  ActiveFeePolicyType,
  CreateTopupRequestInput,
  WalletAccountType,
  WalletTransactionType,
  WalletTopupRequestType,
  ChargeType,
} from '../schemas';
import { resolveFeePolicyCodes } from '../fee-codes';

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
  walletTxnType: 'TOPUP' | 'LISTING_FEE' | 'REFUND' | 'ADJUSTMENT' | 'REVERSAL';
  description?: string;
  /** Used when the fee policy includes a percentage of rent (listing create). */
  percentBaseValue?: number;
}

export interface PaidActionResult {
  chargeId: string;
  walletTransactionId: string;
  debitedAmount: string;
  currency: string;
}

type FeePolicyRow = {
  id: string;
  code: string;
  name: string;
  currency: string;
  fixed_amount?: string | number | null;
  percentage?: string | number | null;
  min_amount?: string | number | null;
  max_amount?: string | number | null;
};

async function fetchActiveFeePolicyRow(
  feeCode: string,
  executor: Queryable = db
): Promise<FeePolicyRow> {
  const codes = resolveFeePolicyCodes(feeCode);
  const result = await executor.query(
    `SELECT id, code, name, currency, fixed_amount, percentage, min_amount, max_amount
     FROM "FeePolicy"
     WHERE code = ANY($1::text[])
       AND is_active = true
       AND effective_from <= NOW()
       AND (effective_to IS NULL OR effective_to > NOW())
     ORDER BY array_position($1::text[], code), version DESC
     LIMIT 1`,
    [codes]
  );

  if (result.rows.length === 0) {
    throw new AppError(
      404,
      `Fee policy not configured for code: ${feeCode} (also checked: ${codes.join(', ')})`
    );
  }

  return result.rows[0];
}

/** Resolve billable amount from flexible FeePolicy columns (base_amount was removed). */
function resolveFeePolicyAmount(
  row: {
    fixed_amount?: string | number | null;
    percentage?: string | number | null;
    min_amount?: string | number | null;
    max_amount?: string | number | null;
  },
  percentBaseValue?: number
): number {
  let amount = 0;

  const fixed = row.fixed_amount != null ? Number(row.fixed_amount) : 0;
  if (Number.isFinite(fixed) && fixed > 0) {
    amount += fixed;
  }

  const pct = row.percentage != null ? Number(row.percentage) : 0;
  if (Number.isFinite(pct) && pct > 0) {
    if (percentBaseValue == null || !Number.isFinite(percentBaseValue)) {
      throw new AppError(
        400,
        'Fee policy uses a percentage component; a base amount is required to calculate the fee'
      );
    }
    amount += (percentBaseValue * pct) / 100;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new AppError(500, 'Fee policy has no calculable amount');
  }

  const min = row.min_amount != null ? Number(row.min_amount) : null;
  const max = row.max_amount != null ? Number(row.max_amount) : null;
  if (min != null && Number.isFinite(min)) {
    amount = Math.max(amount, min);
  }
  if (max != null && Number.isFinite(max)) {
    amount = Math.min(amount, max);
  }

  return amount;
}

export async function getActiveFeePolicy(
  feeCode: string,
  options?: { percentBaseValue?: number }
): Promise<ActiveFeePolicyType> {
  const row = await fetchActiveFeePolicyRow(feeCode);
  const amount = resolveFeePolicyAmount(row, options?.percentBaseValue);

  return {
    code: row.code,
    name: row.name,
    amount: amount.toFixed(2),
    currency: row.currency,
  };
}

/**
 * Assert payment requirement and debit wallet in a transaction-safe way.
 * Caller must provide the same DB client/transaction context used by the business write.
 */
export async function assertPaidActionAndDebit(
  client: Queryable,
  input: PaidActionInput
): Promise<PaidActionResult> {
  const feePolicy = await fetchActiveFeePolicyRow(input.feeCode, client);
  const requiredAmount = resolveFeePolicyAmount(feePolicy, input.percentBaseValue);
  const chargeAmount = requiredAmount.toFixed(2);

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
    throw new AppError(402, `Payment required for ${input.feeCode}`, true, {
      code: 'PAYMENT_REQUIRED',
      feeCode: input.feeCode,
      requiredAmount: requiredAmount.toFixed(2),
      availableBalance: availableBalance.toFixed(2),
      currency: feePolicy.currency,
    });
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
      chargeAmount,
      chargeAmount,
    ]
  );

  await client.query(
    `UPDATE "WalletAccount"
     SET available_balance = available_balance - $1,
         updated_at = NOW()
     WHERE id = $2`,
    [chargeAmount, wallet.id]
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
      chargeAmount,
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
    debitedAmount: chargeAmount,
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
  const walletResult = await db.query(`SELECT id FROM "WalletAccount" WHERE user_id = $1`, [
    userId,
  ]);

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
 * Create a topup request (initiates bKash payment flow)
 */
export async function createTopupRequest(
  userId: string,
  input: CreateTopupRequestInput
): Promise<WalletTopupRequestType> {
  // Get wallet
  const walletResult = await db.query(`SELECT id FROM "WalletAccount" WHERE user_id = $1`, [
    userId,
  ]);

  if (walletResult.rows.length === 0) {
    throw new AppError(404, 'Wallet not found');
  }

  const walletId = walletResult.rows[0].id;

  const topupId = createId();
  const externalRequestId = `${userId.substring(0, 8)}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const createResult = await createPaymentIntent(input.amount, topupId);
  const paymentId = createResult.paymentId;
  const executeResult = await executePayment(paymentId);
  const verifyResult = await queryPayment(paymentId);

  const executeStatusOk = !executeResult.statusCode || executeResult.statusCode === '0000';
  const verifyStatusOk = !verifyResult.statusCode || verifyResult.statusCode === '0000';
  const executeTxnStatus = executeResult.transactionStatus;
  const verifyTxnStatus = verifyResult.transactionStatus;
  const externalTrxId =
    verifyResult.trxID ||
    verifyResult.transactionID ||
    executeResult.trxID ||
    executeResult.transactionID ||
    null;

  let status: 'SUCCESS' | 'FAILED' = 'FAILED';
  let failureReason: string | null = null;

  if (
    executeStatusOk &&
    verifyStatusOk &&
    executeTxnStatus === 'Completed' &&
    verifyTxnStatus === 'Completed' &&
    externalTrxId
  ) {
    status = 'SUCCESS';
  } else {
    failureReason =
      verifyResult.statusMessage ||
      executeResult.statusMessage ||
      `Payment not completed (execute=${executeTxnStatus || 'unknown'}, query=${verifyTxnStatus || 'unknown'})`;
  }

  const settledAmount = Number(verifyResult.amount ?? executeResult.amount ?? input.amount);
  const client = await db.connect();
  let topup: any;

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO "WalletTopupRequest" (
        id, wallet_account_id, provider, status, requested_amount, currency,
        external_request_id, external_payment_id, external_trx_id, provider_payload,
        failure_reason, expires_at, completed_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'BDT', $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING
        id, wallet_account_id, provider, status, requested_amount, currency,
        external_request_id, external_payment_id, external_trx_id, failure_reason,
        expires_at, completed_at, created_at`,
      [
        topupId,
        walletId,
        input.provider,
        status,
        input.amount,
        externalRequestId,
        paymentId,
        externalTrxId,
        JSON.stringify({ create: createResult, execute: executeResult, query: verifyResult }),
        failureReason,
        expiresAt,
      ]
    );

    topup = result.rows[0];

    if (status === 'SUCCESS') {
      if (!Number.isFinite(settledAmount) || settledAmount <= 0) {
        throw new AppError(400, 'Invalid amount in provider settlement response');
      }

      await client.query(
        `UPDATE "WalletAccount"
         SET available_balance = available_balance + $1,
             updated_at = NOW()
         WHERE id = $2`,
        [settledAmount, walletId]
      );

      await client.query(
        `INSERT INTO "WalletTransaction" (
          id, wallet_account_id, direction, type, status,
          amount, currency, description, reference_type, reference_id,
          created_at, posted_at
        ) VALUES (
          $1, $2, 'CREDIT', 'TOPUP', 'POSTED',
          $3, 'BDT', 'bKash topup', 'TOPUP_REQUEST', $4,
          NOW(), NOW()
        )`,
        [createId(), walletId, settledAmount, topupId]
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  return {
    topupId: topup.id,
    status: topup.status,
    requestedAmount: topup.requested_amount.toString(),
    currency: topup.currency,
    provider: topup.provider,
    externalRequestId: topup.external_request_id,
    externalPaymentId: topup.external_payment_id,
    externalTrxId: topup.external_trx_id,
    failureReason: topup.failure_reason,
    expiresAt: topup.expires_at.toISOString(),
    createdAt: topup.created_at.toISOString(),
    completedAt: topup.completed_at?.toISOString() || null,
  };
}

/**
 * Get topup request status
 */
export async function getTopupRequest(
  userId: string,
  topupId: string
): Promise<WalletTopupRequestType> {
  // Verify user owns this topup
  const result = await db.query(
    `SELECT 
      tr.id, tr.provider, tr.status, tr.requested_amount, tr.currency,
      tr.external_request_id, tr.external_payment_id, tr.external_trx_id,
      tr.failure_reason, tr.expires_at, tr.completed_at, tr.created_at,
      wa.user_id
     FROM "WalletTopupRequest" tr
     JOIN "WalletAccount" wa ON tr.wallet_account_id = wa.id
     WHERE tr.id = $1`,
    [topupId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Topup request not found');
  }

  const topup = result.rows[0];

  if (topup.user_id !== userId) {
    throw new AppError(403, 'Unauthorized access to topup request');
  }

  return {
    topupId: topup.id,
    status: topup.status,
    requestedAmount: topup.requested_amount.toString(),
    currency: topup.currency,
    provider: topup.provider,
    externalRequestId: topup.external_request_id,
    externalPaymentId: topup.external_payment_id,
    externalTrxId: topup.external_trx_id,
    failureReason: topup.failure_reason,
    expiresAt: topup.expires_at.toISOString(),
    createdAt: topup.created_at.toISOString(),
    completedAt: topup.completed_at?.toISOString() || null,
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
  const countResult = await db.query(`SELECT COUNT(*) as count FROM "Charge" WHERE user_id = $1`, [
    userId,
  ]);

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
 * Handle bKash webhook callback for payment status
 * Validates signature and updates topup/wallet state
 */
export async function handleBKashCallback(payload: Record<string, any>): Promise<void> {
  const { paymentID } = payload;

  if (!paymentID) {
    throw new AppError(400, 'Missing paymentID in webhook');
  }

  // As per callback flow: execute with provider first, then mutate wallet/topup state.
  const executeResult = await executePayment(String(paymentID));
  const queryResult = await queryPayment(String(paymentID));

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const topupResult = await client.query(
      `SELECT id, wallet_account_id, requested_amount, status
       FROM "WalletTopupRequest"
       WHERE external_payment_id = $1
       FOR UPDATE`,
      [paymentID]
    );

    if (topupResult.rows.length === 0) {
      throw new AppError(404, 'Topup request not found');
    }

    const topup = topupResult.rows[0];

    // Idempotency guard: if already successful, do not credit twice.
    if (topup.status === 'SUCCESS') {
      await client.query('COMMIT');
      return;
    }

    let newStatus = 'FAILED';
    let failureReason = null;
    const executeStatusCode = executeResult.statusCode;
    const executeTxnStatus = executeResult.transactionStatus;
    const executeTrxId = executeResult.transactionID || executeResult.trxID || null;
    const queryTxnStatus = queryResult.transactionStatus;
    const queryTrxId = queryResult.transactionID || queryResult.trxID || null;
    const executeStatusOk = !executeStatusCode || executeStatusCode === '0000';
    const queryStatusOk = !queryResult.statusCode || queryResult.statusCode === '0000';

    const callbackAmount = Number(
      queryResult.amount ?? executeResult.amount ?? topup.requested_amount
    );

    if (
      executeStatusOk &&
      queryStatusOk &&
      executeTxnStatus === 'Completed' &&
      queryTxnStatus === 'Completed' &&
      (queryTrxId || executeTrxId)
    ) {
      newStatus = 'SUCCESS';

      if (!Number.isFinite(callbackAmount) || callbackAmount <= 0) {
        throw new AppError(400, 'Invalid amount in execute response');
      }

      // Credit wallet on successful payment
      await client.query(
        `UPDATE "WalletAccount" 
         SET available_balance = available_balance + $1, updated_at = NOW()
         WHERE id = $2`,
        [callbackAmount, topup.wallet_account_id]
      );

      // Create wallet transaction record
      await client.query(
        `INSERT INTO "WalletTransaction" (
          id, wallet_account_id, direction, type, status, amount, 
          currency, description, reference_type, reference_id, created_at, posted_at
        ) VALUES ($1, $2, 'CREDIT', 'TOPUP', 'POSTED', $3, 'BDT', 
                  'bKash topup', 'TOPUP_REQUEST', $4, NOW(), NOW())`,
        [createId(), topup.wallet_account_id, callbackAmount, topup.id]
      );
    } else {
      failureReason =
        queryResult.statusMessage ||
        executeResult.statusMessage ||
        `Payment not completed (execute=${executeTxnStatus || 'unknown'}, query=${queryTxnStatus || 'unknown'})`;
    }

    // Update topup request status
    await client.query(
      `UPDATE "WalletTopupRequest" 
       SET status = $1,
           external_trx_id = $2,
           failure_reason = $3,
           provider_payload = $4,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $5`,
      [
        newStatus,
        executeTrxId,
        failureReason,
        JSON.stringify({ callback: payload, execute: executeResult, query: queryResult }),
        topup.id,
      ]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
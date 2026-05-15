import { db } from '@/db/client';
import { AppError } from '@/errors/base';
import type {
  ListDiscountPoliciesQuery,
  CreateDiscountPolicyInput,
  UpdateDiscountPolicyInput,
} from '../schemas';

function createCuidLikeId(): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  return `c${Date.now().toString(36)}${random}`;
}

function mapDiscountPolicyRow(row: any) {
  return {
    id: row.id,
    code: row.code,
    feePolicyCode: row.fee_policy_code,
    discountType: row.discount_type,
    fixedAmount: row.fixed_amount != null ? row.fixed_amount.toString() : null,
    percentage: row.percentage != null ? row.percentage.toString() : null,
    minAmount: row.min_amount != null ? row.min_amount.toString() : null,
    maxAmount: row.max_amount != null ? row.max_amount.toString() : null,
    maxRedemptionsTotal: row.max_redemptions_total != null ? Number(row.max_redemptions_total) : null,
    maxRedemptionsPerUser: row.max_redemptions_per_user != null ? Number(row.max_redemptions_per_user) : null,
    eligibleRole: row.eligible_role ?? null,
    isActive: row.is_active,
    effectiveFrom: row.effective_from instanceof Date ? row.effective_from.toISOString() : new Date(row.effective_from).toISOString(),
    effectiveTo: row.effective_to
      ? row.effective_to instanceof Date
        ? row.effective_to.toISOString()
        : new Date(row.effective_to).toISOString()
      : null,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
  };
}

function validateDiscountRules(input: {
  discountType: string;
  fixedAmount: number | null;
  percentage: number | null;
  minAmount: number | null;
  maxAmount: number | null;
  effectiveFrom: Date;
  effectiveTo: Date | null;
}) {
  if (input.discountType === 'FIXED') {
    if (typeof input.fixedAmount !== 'number') {
      throw new AppError(400, 'fixedAmount is required for FIXED discount type');
    }
    if (typeof input.percentage === 'number') {
      throw new AppError(400, 'percentage is not allowed for FIXED discount type');
    }
  }

  if (input.discountType === 'PERCENTAGE') {
    if (typeof input.percentage !== 'number') {
      throw new AppError(400, 'percentage is required for PERCENTAGE discount type');
    }
    if (typeof input.fixedAmount === 'number') {
      throw new AppError(400, 'fixedAmount is not allowed for PERCENTAGE discount type');
    }
  }

  if (
    typeof input.minAmount === 'number' &&
    typeof input.maxAmount === 'number' &&
    input.minAmount > input.maxAmount
  ) {
    throw new AppError(400, 'minAmount cannot be greater than maxAmount');
  }

  if (input.effectiveTo && input.effectiveTo <= input.effectiveFrom) {
    throw new AppError(400, 'effectiveTo must be later than effectiveFrom');
  }
}

export async function listDiscountPolicies(query: ListDiscountPoliciesQuery) {
  const { page = 1, limit = 10, code, feePolicyCode, isActive } = query;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (code) {
    conditions.push(`code = $${idx++}`);
    params.push(code);
  }

  if (feePolicyCode) {
    conditions.push(`fee_policy_code = $${idx++}`);
    params.push(feePolicyCode);
  }

  if (typeof isActive === 'boolean') {
    conditions.push(`is_active = $${idx++}`);
    params.push(isActive);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*)::int as total FROM "DiscountPolicy" ${whereClause}`,
    params
  );

  const total = countResult.rows[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  params.push(limit, offset);
  const listResult = await db.query(
    `SELECT id, code, fee_policy_code, discount_type,
            fixed_amount, percentage, min_amount, max_amount,
            max_redemptions_total, max_redemptions_per_user,
            eligible_role, is_active, effective_from, effective_to, created_at
     FROM "DiscountPolicy"
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params
  );

  return {
    discountPolicies: listResult.rows.map(mapDiscountPolicyRow),
    pagination: { page, limit, total, totalPages },
  };
}

export async function getDiscountPolicyById(discountPolicyId: string) {
  const result = await db.query(
    `SELECT id, code, fee_policy_code, discount_type,
            fixed_amount, percentage, min_amount, max_amount,
            max_redemptions_total, max_redemptions_per_user,
            eligible_role, is_active, effective_from, effective_to, created_at
     FROM "DiscountPolicy"
     WHERE id = $1`,
    [discountPolicyId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Discount policy not found');
  }

  return mapDiscountPolicyRow(result.rows[0]);
}

export async function createDiscountPolicy(input: CreateDiscountPolicyInput) {
  const effectiveFrom = new Date(input.effectiveFrom);
  const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;

  validateDiscountRules({
    discountType: input.discountType,
    fixedAmount: typeof input.fixedAmount === 'number' ? input.fixedAmount : null,
    percentage: typeof input.percentage === 'number' ? input.percentage : null,
    minAmount: typeof input.minAmount === 'number' ? input.minAmount : null,
    maxAmount: typeof input.maxAmount === 'number' ? input.maxAmount : null,
    effectiveFrom,
    effectiveTo,
  });

  const discountPolicyId = createCuidLikeId();
  const createResult = await db.query(
    `INSERT INTO "DiscountPolicy" (
      id, code, fee_policy_code, discount_type,
      fixed_amount, percentage, min_amount, max_amount,
      max_redemptions_total, max_redemptions_per_user,
      eligible_role, is_active, effective_from, effective_to, created_at
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7, $8,
      $9, $10,
      $11, $12, $13, $14, NOW()
    )
    RETURNING id, code, fee_policy_code, discount_type,
              fixed_amount, percentage, min_amount, max_amount,
              max_redemptions_total, max_redemptions_per_user,
              eligible_role, is_active, effective_from, effective_to, created_at`,
    [
      discountPolicyId,
      input.code,
      input.feePolicyCode,
      input.discountType,
      input.fixedAmount ?? null,
      input.percentage ?? null,
      input.minAmount ?? null,
      input.maxAmount ?? null,
      input.maxRedemptionsTotal ?? null,
      input.maxRedemptionsPerUser ?? null,
      input.eligibleRole ?? null,
      input.isActive ?? true,
      effectiveFrom,
      effectiveTo,
    ]
  );

  return mapDiscountPolicyRow(createResult.rows[0]);
}

export async function updateDiscountPolicy(discountPolicyId: string, input: UpdateDiscountPolicyInput) {
  const existingResult = await db.query(
    `SELECT id, code, fee_policy_code, discount_type,
            fixed_amount, percentage, min_amount, max_amount,
            max_redemptions_total, max_redemptions_per_user,
            eligible_role, is_active, effective_from, effective_to
     FROM "DiscountPolicy"
     WHERE id = $1`,
    [discountPolicyId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError(404, 'Discount policy not found');
  }

  const existing = existingResult.rows[0];

  const nextDiscountType = input.discountType ?? existing.discount_type;
  const nextFixedAmount = input.fixedAmount !== undefined ? input.fixedAmount : existing.fixed_amount;
  const nextPercentage = input.percentage !== undefined ? input.percentage : existing.percentage;
  const nextMinAmount = input.minAmount !== undefined ? input.minAmount : existing.min_amount;
  const nextMaxAmount = input.maxAmount !== undefined ? input.maxAmount : existing.max_amount;
  const nextEffectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : existing.effective_from;
  const nextEffectiveTo = input.effectiveTo !== undefined
    ? (input.effectiveTo ? new Date(input.effectiveTo) : null)
    : existing.effective_to;

  validateDiscountRules({
    discountType: nextDiscountType,
    fixedAmount: nextFixedAmount == null ? null : Number(nextFixedAmount),
    percentage: nextPercentage == null ? null : Number(nextPercentage),
    minAmount: nextMinAmount == null ? null : Number(nextMinAmount),
    maxAmount: nextMaxAmount == null ? null : Number(nextMaxAmount),
    effectiveFrom: nextEffectiveFrom instanceof Date ? nextEffectiveFrom : new Date(nextEffectiveFrom),
    effectiveTo: nextEffectiveTo,
  });

  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (input.code !== undefined) {
    updates.push(`code = $${idx++}`);
    params.push(input.code);
  }

  if (input.feePolicyCode !== undefined) {
    updates.push(`fee_policy_code = $${idx++}`);
    params.push(input.feePolicyCode);
  }

  if (input.discountType !== undefined) {
    updates.push(`discount_type = $${idx++}`);
    params.push(input.discountType);
  }

  if (input.fixedAmount !== undefined) {
    updates.push(`fixed_amount = $${idx++}`);
    params.push(input.fixedAmount);
  }

  if (input.percentage !== undefined) {
    updates.push(`percentage = $${idx++}`);
    params.push(input.percentage);
  }

  if (input.minAmount !== undefined) {
    updates.push(`min_amount = $${idx++}`);
    params.push(input.minAmount);
  }

  if (input.maxAmount !== undefined) {
    updates.push(`max_amount = $${idx++}`);
    params.push(input.maxAmount);
  }

  if (input.maxRedemptionsTotal !== undefined) {
    updates.push(`max_redemptions_total = $${idx++}`);
    params.push(input.maxRedemptionsTotal);
  }

  if (input.maxRedemptionsPerUser !== undefined) {
    updates.push(`max_redemptions_per_user = $${idx++}`);
    params.push(input.maxRedemptionsPerUser);
  }

  if (input.eligibleRole !== undefined) {
    updates.push(`eligible_role = $${idx++}`);
    params.push(input.eligibleRole);
  }

  if (input.effectiveFrom !== undefined) {
    updates.push(`effective_from = $${idx++}`);
    params.push(new Date(input.effectiveFrom));
  }

  if (input.effectiveTo !== undefined) {
    updates.push(`effective_to = $${idx++}`);
    params.push(input.effectiveTo ? new Date(input.effectiveTo) : null);
  }

  if (typeof input.isActive === 'boolean') {
    updates.push(`is_active = $${idx++}`);
    params.push(input.isActive);
  }

  if (updates.length === 0) {
    throw new AppError(400, 'No valid fields provided to update');
  }

  params.push(discountPolicyId);
  const updateResult = await db.query(
    `UPDATE "DiscountPolicy"
     SET ${updates.join(', ')}
     WHERE id = $${idx}
     RETURNING id, code, fee_policy_code, discount_type,
               fixed_amount, percentage, min_amount, max_amount,
               max_redemptions_total, max_redemptions_per_user,
               eligible_role, is_active, effective_from, effective_to, created_at`,
    params
  );

  return mapDiscountPolicyRow(updateResult.rows[0]);
}

export async function activateDiscountPolicy(discountPolicyId: string) {
  const result = await db.query(
    `UPDATE "DiscountPolicy"
     SET is_active = true
     WHERE id = $1
     RETURNING id, code, fee_policy_code, discount_type,
               fixed_amount, percentage, min_amount, max_amount,
               max_redemptions_total, max_redemptions_per_user,
               eligible_role, is_active, effective_from, effective_to, created_at`,
    [discountPolicyId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Discount policy not found');
  }

  return mapDiscountPolicyRow(result.rows[0]);
}

export async function deactivateDiscountPolicy(discountPolicyId: string) {
  const result = await db.query(
    `UPDATE "DiscountPolicy"
     SET is_active = false
     WHERE id = $1
     RETURNING id, code, fee_policy_code, discount_type,
               fixed_amount, percentage, min_amount, max_amount,
               max_redemptions_total, max_redemptions_per_user,
               eligible_role, is_active, effective_from, effective_to, created_at`,
    [discountPolicyId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Discount policy not found');
  }

  return mapDiscountPolicyRow(result.rows[0]);
}

export async function listDiscountEligibleUsers(discountPolicyId: string, page: number = 1, limit: number = 10) {
  const policyResult = await db.query(
    `SELECT id FROM "DiscountPolicy" WHERE id = $1`,
    [discountPolicyId]
  );

  if (policyResult.rows.length === 0) {
    throw new AppError(404, 'Discount policy not found');
  }

  const offset = (page - 1) * limit;

  const countResult = await db.query(
    `SELECT COUNT(*)::int as total
     FROM "DiscountEligibleUser"
     WHERE discount_policy_id = $1`,
    [discountPolicyId]
  );

  const total = countResult.rows[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const listResult = await db.query(
    `SELECT user_id, created_at
     FROM "DiscountEligibleUser"
     WHERE discount_policy_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [discountPolicyId, limit, offset]
  );

  const eligibleUsers = listResult.rows.map((row) => ({
    userId: row.user_id,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
  }));

  return {
    eligibleUsers,
    pagination: { page, limit, total, totalPages },
  };
}

export async function addDiscountEligibleUsers(discountPolicyId: string, userIds: string[]) {
  const policyResult = await db.query(
    `SELECT id FROM "DiscountPolicy" WHERE id = $1`,
    [discountPolicyId]
  );

  if (policyResult.rows.length === 0) {
    throw new AppError(404, 'Discount policy not found');
  }

  await db.query(
    `INSERT INTO "DiscountEligibleUser" (discount_policy_id, user_id, created_at)
     SELECT $1, unnest($2::text[]), NOW()
     ON CONFLICT DO NOTHING`,
    [discountPolicyId, userIds]
  );

  return {
    discountPolicyId,
    userIds,
  };
}

export async function removeDiscountEligibleUsers(discountPolicyId: string, userIds: string[]) {
  const policyResult = await db.query(
    `SELECT id FROM "DiscountPolicy" WHERE id = $1`,
    [discountPolicyId]
  );

  if (policyResult.rows.length === 0) {
    throw new AppError(404, 'Discount policy not found');
  }

  await db.query(
    `DELETE FROM "DiscountEligibleUser"
     WHERE discount_policy_id = $1 AND user_id = ANY($2::text[])`,
    [discountPolicyId, userIds]
  );

  return {
    discountPolicyId,
    userIds,
  };
}

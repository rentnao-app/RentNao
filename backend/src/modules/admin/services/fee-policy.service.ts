import { db } from '@/db/client';
import { AppError } from '@/errors/base';
import type { ListFeePoliciesQuery, CreateFeePolicyInput, UpdateFeePolicyInput } from '../schemas';

function createCuidLikeId(): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  return `c${Date.now().toString(36)}${random}`;
}

function mapFeePolicyRow(row: any) {
  return {
    id: row.id,
    code: row.code,
    version: row.version,
    name: row.name,
    currency: row.currency,
    fixedAmount: row.fixed_amount != null ? row.fixed_amount.toString() : null,
    percentage: row.percentage != null ? row.percentage.toString() : null,
    percentBaseField: row.percent_base_field ?? null,
    minAmount: row.min_amount != null ? row.min_amount.toString() : null,
    maxAmount: row.max_amount != null ? row.max_amount.toString() : null,
    isActive: row.is_active,
    effectiveFrom: row.effective_from instanceof Date ? row.effective_from.toISOString() : new Date(row.effective_from).toISOString(),
    effectiveTo: row.effective_to
      ? row.effective_to instanceof Date
        ? row.effective_to.toISOString()
        : new Date(row.effective_to).toISOString()
      : null,
    createdBy: row.created_by,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
  };
}

export async function listFeePolicies(query: ListFeePoliciesQuery) {
  const { page = 1, limit = 10, code, isActive } = query;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (code) {
    conditions.push(`code = $${idx++}`);
    params.push(code);
  }

  if (typeof isActive === 'boolean') {
    conditions.push(`is_active = $${idx++}`);
    params.push(isActive);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*)::int as total FROM "FeePolicy" ${whereClause}`,
    params
  );

  const total = countResult.rows[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  params.push(limit, offset);
  const listResult = await db.query(
    `SELECT id, code, version, name, currency,
            fixed_amount, percentage, percent_base_field, min_amount, max_amount,
            is_active, effective_from, effective_to, created_by, created_at
     FROM "FeePolicy"
     ${whereClause}
     ORDER BY code ASC, version DESC
     LIMIT $${idx++} OFFSET $${idx++}`,
    params
  );

  return {
    feePolicies: listResult.rows.map(mapFeePolicyRow),
    pagination: { page, limit, total, totalPages },
  };
}

export async function getFeePolicyById(feePolicyId: string) {
  const result = await db.query(
    `SELECT id, code, version, name, currency,
            fixed_amount, percentage, percent_base_field, min_amount, max_amount,
            is_active, effective_from, effective_to, created_by, created_at
     FROM "FeePolicy"
     WHERE id = $1`,
    [feePolicyId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Fee policy not found');
  }

  return mapFeePolicyRow(result.rows[0]);
}

export async function createFeePolicy(input: CreateFeePolicyInput, adminUserId: string) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const latestVersionResult = await client.query(
      `SELECT COALESCE(MAX(version), 0) as max_version
       FROM "FeePolicy"
       WHERE code = $1`,
      [input.code]
    );

    const nextVersion = Number(latestVersionResult.rows[0].max_version) + 1;

    const effectiveFrom = new Date(input.effectiveFrom);
    const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;

    if (effectiveTo && effectiveTo <= effectiveFrom) {
      throw new AppError(400, 'effectiveTo must be later than effectiveFrom');
    }

    const fixedAmount = typeof input.fixedAmount === 'number' ? input.fixedAmount : null;

    if (typeof input.percentage === 'number' && !input.percentBaseField) {
      throw new AppError(400, 'percentBaseField is required when percentage is provided');
    }

    if (
      typeof input.minAmount === 'number' &&
      typeof input.maxAmount === 'number' &&
      input.minAmount > input.maxAmount
    ) {
      throw new AppError(400, 'minAmount cannot be greater than maxAmount');
    }

    const feePolicyId = createCuidLikeId();

    const createResult = await client.query(
      `INSERT INTO "FeePolicy" (
        id, code, version, name, currency,
        fixed_amount, percentage, percent_base_field, min_amount, max_amount,
        is_active, effective_from, effective_to, created_by, created_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, NOW()
      )
      RETURNING id, code, version, name, currency,
                fixed_amount, percentage, percent_base_field, min_amount, max_amount,
                is_active, effective_from, effective_to, created_by, created_at`,
      [
        feePolicyId,
        input.code,
        nextVersion,
        input.name,
        input.currency.toUpperCase(),
        fixedAmount,
        input.percentage ?? null,
        input.percentBaseField ?? null,
        input.minAmount ?? null,
        input.maxAmount ?? null,
        input.isActive,
        effectiveFrom,
        effectiveTo,
        adminUserId,
      ]
    );

    if (input.isActive) {
      await client.query(
        `UPDATE "FeePolicy"
         SET is_active = false
         WHERE code = $1 AND id <> $2`,
        [input.code, createResult.rows[0].id]
      );
    }

    await client.query('COMMIT');
    return mapFeePolicyRow(createResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function updateFeePolicy(feePolicyId: string, input: UpdateFeePolicyInput) {
  const existingResult = await db.query(
    `SELECT id, code, percent_base_field FROM "FeePolicy" WHERE id = $1`,
    [feePolicyId]
  );

  if (existingResult.rows.length === 0) {
    throw new AppError(404, 'Fee policy not found');
  }

  const existingCode = existingResult.rows[0].code;
  const existingPercentBaseField = existingResult.rows[0].percent_base_field as string | null;
  const updates: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (typeof input.name === 'string') {
    updates.push(`name = $${idx++}`);
    params.push(input.name);
  }

  if (typeof input.currency === 'string') {
    updates.push(`currency = $${idx++}`);
    params.push(input.currency.toUpperCase());
  }

  if (input.fixedAmount !== undefined) {
    updates.push(`fixed_amount = $${idx++}`);
    params.push(input.fixedAmount);
  }

  if (input.percentage !== undefined) {
    updates.push(`percentage = $${idx++}`);
    params.push(input.percentage);
  }

  if (input.percentBaseField !== undefined) {
    updates.push(`percent_base_field = $${idx++}`);
    params.push(input.percentBaseField);
  }

  if (input.minAmount !== undefined) {
    updates.push(`min_amount = $${idx++}`);
    params.push(input.minAmount);
  }

  if (input.maxAmount !== undefined) {
    updates.push(`max_amount = $${idx++}`);
    params.push(input.maxAmount);
  }

  if (typeof input.effectiveFrom === 'string') {
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

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    if (typeof input.percentage === 'number' && input.percentBaseField === null) {
      throw new AppError(400, 'percentBaseField cannot be null when percentage is provided');
    }

    if (
      typeof input.percentage === 'number' &&
      input.percentBaseField === undefined &&
      !existingPercentBaseField
    ) {
      throw new AppError(400, 'percentBaseField is required when percentage is provided');
    }

    if (
      typeof input.minAmount === 'number' &&
      typeof input.maxAmount === 'number' &&
      input.minAmount > input.maxAmount
    ) {
      throw new AppError(400, 'minAmount cannot be greater than maxAmount');
    }

    params.push(feePolicyId);
    const result = await client.query(
      `UPDATE "FeePolicy"
       SET ${updates.join(', ')}
       WHERE id = $${idx}
       RETURNING id, code, version, name, currency,
                 fixed_amount, percentage, percent_base_field, min_amount, max_amount,
                 is_active, effective_from, effective_to, created_by, created_at`,
      params
    );

    const updated = result.rows[0];

    if (typeof input.isActive === 'boolean' && input.isActive) {
      await client.query(
        `UPDATE "FeePolicy"
         SET is_active = false
         WHERE code = $1 AND id <> $2`,
        [existingCode, feePolicyId]
      );
    }

    await client.query('COMMIT');
    return mapFeePolicyRow(updated);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function activateFeePolicy(feePolicyId: string) {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const found = await client.query(
      `SELECT id, code FROM "FeePolicy" WHERE id = $1`,
      [feePolicyId]
    );

    if (found.rows.length === 0) {
      throw new AppError(404, 'Fee policy not found');
    }

    const code = found.rows[0].code;

    await client.query(
      `UPDATE "FeePolicy"
       SET is_active = false
       WHERE code = $1`,
      [code]
    );

    const result = await client.query(
      `UPDATE "FeePolicy"
       SET is_active = true
       WHERE id = $1
       RETURNING id, code, version, name, currency,
                 fixed_amount, percentage, percent_base_field, min_amount, max_amount,
                 is_active, effective_from, effective_to, created_by, created_at`,
      [feePolicyId]
    );

    await client.query('COMMIT');
    return mapFeePolicyRow(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deactivateFeePolicy(feePolicyId: string) {
  const result = await db.query(
    `UPDATE "FeePolicy"
     SET is_active = false
     WHERE id = $1
     RETURNING id, code, version, name, currency,
               fixed_amount, percentage, percent_base_field, min_amount, max_amount,
               is_active, effective_from, effective_to, created_by, created_at`,
    [feePolicyId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Fee policy not found');
  }

  return mapFeePolicyRow(result.rows[0]);
}

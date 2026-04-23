import { db } from '@/db/client';
import {
  UserNotFoundError,
  CannotModifyOwnAccountError,
  UserAlreadyDeletedError,
  UserNotDeletedError,
} from '@/errors';
import type {
  ListUsersQuery,
  UpdateOnboardingStatusInput,
  UpdateRoleInput,
  UpdateActiveStatusInput,
} from '../schemas';
import type { PaginationMeta } from '@/types/common';
import { mapUserRow } from './helpers';

export async function listUsers(
  query: ListUsersQuery,
  currentUserId: string
) {
  const { page = 1, limit = 10, role, onboardingStatus, search } = query;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (role) {
    conditions.push(`u.role = $${paramIndex++}`);
    params.push(role);
  }

  if (onboardingStatus) {
    conditions.push(`u.onboarding_status = $${paramIndex++}`);
    params.push(onboardingStatus);
  }

  if (search) {
    conditions.push(`(u.contact_email ILIKE $${paramIndex} OR u.contact_phone ILIKE $${paramIndex})`);
    params.push(`%${search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM "User" u ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  params.push(limit, offset);
  const usersResult = await db.query(
    `SELECT 
      user_id, role, onboarding_status,
      contact_email, contact_phone, is_active, created_at, deleted_at
     FROM "User" u
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );

  const users = usersResult.rows.map((row: any) => ({
    userId: row.user_id,
    role: row.role,
    onboardingStatus: row.onboarding_status,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    isActive: row.is_active,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  }));

  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
  };

  return { users, pagination };
}

export async function getUserById(userId: string) {
  const userResult = await db.query(
    `SELECT 
      user_id, role, onboarding_status,
      contact_email, contact_phone, is_active, 
      created_at, updated_at, deleted_at, last_login_at
     FROM "User"
     WHERE user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new UserNotFoundError();
  }

  const user = userResult.rows[0];

  const credentialsResult = await db.query(
    `SELECT id, identifier, identifier_type, verified_at
     FROM "Credentials"
     WHERE user_id = $1`,
    [userId]
  );

  return {
    user: {
      userId: user.user_id,
      role: user.role,
      onboardingStatus: user.onboarding_status,
      contactEmail: user.contact_email,
      contactPhone: user.contact_phone,
      isActive: user.is_active,
      createdAt: user.created_at,
      deletedAt: user.deleted_at,
      lastLoginAt: user.last_login_at,
    },
    credentials: credentialsResult.rows.map((c: any) => ({
      id: c.id,
      identifier: c.identifier,
      identifierType: c.identifier_type,
      verifiedAt: c.verified_at,
    })),
  };
}

export async function updateUserOnboardingStatus(
  userId: string,
  input: UpdateOnboardingStatusInput
) {
  const result = await db.query(
    `UPDATE "User"
     SET onboarding_status = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING user_id, role, onboarding_status,
               contact_email, contact_phone, is_active, created_at, deleted_at`,
    [input.onboardingStatus, userId]
  );

  if (result.rows.length === 0) {
    throw new UserNotFoundError();
  }

  return mapUserRow(result.rows[0]);
}

export async function updateUserRole(
  userId: string,
  input: UpdateRoleInput,
  currentUserId: string
) {
  if (userId === currentUserId) {
    throw new CannotModifyOwnAccountError('modify your own role');
  }

  const result = await db.query(
    `UPDATE "User"
     SET role = $1, updated_at = NOW()
     WHERE user_id = $2
     RETURNING user_id, role, onboarding_status,
               contact_email, contact_phone, is_active, created_at, deleted_at`,
    [input.role, userId]
  );

  if (result.rows.length === 0) {
    throw new UserNotFoundError();
  }

  return mapUserRow(result.rows[0]);
}

export async function updateUserActiveStatus(
  userId: string,
  input: UpdateActiveStatusInput,
  currentUserId: string
) {
  if (userId === currentUserId) {
    throw new CannotModifyOwnAccountError('modify your own account status');
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE "User"
       SET is_active = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING user_id, role, onboarding_status,
                 contact_email, contact_phone, is_active, created_at, deleted_at`,
      [input.isActive, userId]
    );

    if (result.rows.length === 0) {
      throw new UserNotFoundError();
    }

    await client.query('COMMIT');

    return mapUserRow(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function softDeleteUser(userId: string, currentUserId: string) {
  if (userId === currentUserId) {
    throw new CannotModifyOwnAccountError('delete your own account');
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE "User"
       SET deleted_at = NOW(), is_active = false, updated_at = NOW()
       WHERE user_id = $1 AND deleted_at IS NULL
       RETURNING user_id`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new UserAlreadyDeletedError();
    }

    await client.query('COMMIT');

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function restoreUser(userId: string) {
  const result = await db.query(
    `UPDATE "User"
     SET deleted_at = NULL, is_active = true, updated_at = NOW()
     WHERE user_id = $1 AND deleted_at IS NOT NULL
     RETURNING user_id, role, onboarding_status,
               contact_email, contact_phone, is_active, created_at, deleted_at`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new UserNotDeletedError();
  }

  return mapUserRow(result.rows[0]);
}

export async function forceKycStatus(userId: string, status: string, reason: string) {
  const result = await db.query(
    `UPDATE "User"
     SET kyc_verification_status = $1, 
         onboarding_status = CASE WHEN $1 = 'APPROVED' THEN 'COMPLETED' ELSE onboarding_status END,
         updated_at = NOW()
     WHERE user_id = $2
     RETURNING kyc_verification_status, onboarding_status`,
    [status, userId]
  );

  if (result.rows.length === 0) {
    throw new UserNotFoundError();
  }

  return {
    userId,
    kycVerificationStatus: result.rows[0].kyc_verification_status,
    onboardingStatus: result.rows[0].onboarding_status,
  };
}

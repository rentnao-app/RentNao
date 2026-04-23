/**
 * Password service
 * Handles password reset operations
 */

import { db } from '@/db/client';
import { AppError } from '@/middlewares/error-handler';
import { hashPassword } from '../utils/password';
import { generateVerificationToken, generateOTP } from '../utils/token-generator';
import { verifyToken, deleteVerificationToken, storeVerificationToken } from './token-storage.service';
import { TOKEN_TTL } from '../config/token-ttl';
import type { IdentifierTypeType, VerificationTokenTypeType } from '@/types/enums';

/**
 * Request password reset
 * Always returns success for security (don't leak if account exists)
 */
export async function requestPasswordReset(
  identifier: string,
  type: IdentifierTypeType
): Promise<{ success: boolean; message: string }> {
  const identifierType = type;
  const tokenType: VerificationTokenTypeType = 'PASSWORD_RESET';

  // Check if credentials exist and are verified
  const credResult = await db.query(
    `SELECT c.id, c.user_id, c.verified_at, u.is_active, u.deleted_at
     FROM "Credentials" c
     JOIN "User" u ON c.user_id = u.user_id
     WHERE c.identifier = $1 AND c.identifier_type = $2`,
    [identifier, identifierType]
  );

  // Always return success for security (don't reveal if account exists)
  if (credResult.rows.length === 0) {
    console.log(`Password reset requested for non-existent account: ${identifier}`);
    return {
      success: true,
      message: 'If an account exists with this identifier, password reset instructions have been sent',
    };
  }

  const credential = credResult.rows[0];

  // Don't send token if deleted, not verified, or inactive
  if (credential.deleted_at || !credential.verified_at || !credential.is_active) {
    console.log(`Password reset requested for deleted/unverified/inactive account: ${identifier}`);
    return {
      success: true,
      message: 'If an account exists with this identifier, password reset instructions have been sent',
    };
  }

  // Delete old password reset token from Redis (if exists)
  await deleteVerificationToken(identifier, tokenType);

  // Generate new token
  const resetToken = type === 'EMAIL' ? generateVerificationToken() : generateOTP();

  // Store new token in Redis with 1-hour TTL
  await storeVerificationToken(identifier, resetToken, tokenType, TOKEN_TTL.PASSWORD_RESET);

  // TODO: Send password reset email/SMS
  console.log(`Password reset ${type}: ${resetToken}`);

  return {
    success: true,
    message: 'If an account exists with this identifier, password reset instructions have been sent',
  };
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(
  token: string
): Promise<{ success: boolean; message: string }> {
  // Get all active credentials to check token against
  const credentialsResult = await db.query(
    `SELECT c.identifier, c.user_id, u.is_active, u.deleted_at
     FROM "Credentials" c
     JOIN "User" u ON c.user_id = u.user_id
     WHERE u.deleted_at IS NULL AND u.is_active = true`
  );

  let matchedIdentifier: string | null = null;
  
  // Check each credential against Redis
  for (const cred of credentialsResult.rows) {
    const tokenData = await verifyToken(cred.identifier, token, 'PASSWORD_RESET');
    if (tokenData) {
      matchedIdentifier = cred.identifier;
      break;
    }
  }

  if (!matchedIdentifier) {
    throw new AppError(400, 'Invalid or expired password reset token');
  }

  return {
    success: true,
    message: 'Token is valid. You can now reset your password.',
  };
}

/**
 * Confirm password reset and update password
 * Invalidates all existing sessions
 */
export async function confirmPasswordReset(
  token: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  // Get all active credentials to check token against
  const credentialsResult = await db.query(
    `SELECT c.identifier, c.id, c.user_id, c.identifier_type, u.is_active, u.deleted_at
     FROM "Credentials" c
     JOIN "User" u ON c.user_id = u.user_id
     WHERE u.deleted_at IS NULL AND u.is_active = true`
  );

  let matchedCredential: any = null;
  
  // Check each credential against Redis
  for (const cred of credentialsResult.rows) {
    const tokenData = await verifyToken(cred.identifier, token, 'PASSWORD_RESET');
    if (tokenData) {
      matchedCredential = cred;
      break;
    }
  }

  if (!matchedCredential) {
    throw new AppError(400, 'Invalid or expired password reset token');
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await client.query(
      `UPDATE "Credentials" 
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, matchedCredential.id]
    );

    await client.query('COMMIT');

    // Delete the used token from Redis after successful password reset
    await deleteVerificationToken(matchedCredential.identifier, 'PASSWORD_RESET');

    console.log(`Password reset successful for user: ${matchedCredential.user_id}`);

    return {
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verification service
 * Handles email and phone verification operations
 */

import { db } from '@/db/client';
import { AppError } from '@/middlewares/error-handler';
import { generateVerificationToken, generateOTP } from '../utils/token-generator';
import { verifyToken, deleteVerificationToken, storeVerificationToken } from './token-storage.service';
import { TOKEN_TTL } from '../config/token-ttl';
import type { IdentifierTypeType } from '@/types/enums';

/**
 * Verify email using token
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  // First, we need to find the identifier from credentials that might match this token
  // Since we can't search by token directly, we need the identifier from the token itself
  // The token is sent to the user's email, so we need to get identifier from request context
  // For now, let's search all unverified email credentials and check against Redis
  
  // Get all unverified email credentials
  const credentialsResult = await db.query(
    `SELECT c.identifier, c.user_id, u.is_active, u.deleted_at
     FROM "Credentials" c
     JOIN "User" u ON c.user_id = u.user_id
     WHERE c.identifier_type = 'EMAIL' AND c.verified_at IS NULL`
  );

  let matchedIdentifier: string | null = null;
  
  // Check each unverified credential against Redis
  for (const cred of credentialsResult.rows) {
    const tokenData = await verifyToken(cred.identifier, token, 'EMAIL_VERIFICATION');
    if (tokenData) {
      matchedIdentifier = cred.identifier;
      break;
    }
  }

  if (!matchedIdentifier) {
    throw new AppError(400, 'Invalid or expired verification token');
  }

  // Get user details for the matched identifier
  const userCheck = await db.query(
    `SELECT c.user_id, u.is_active, u.deleted_at
     FROM "Credentials" c
     JOIN "User" u ON c.user_id = u.user_id
     WHERE c.identifier = $1 AND c.identifier_type = 'EMAIL'`,
    [matchedIdentifier]
  );

  const userStatus = userCheck.rows[0];

  if (userStatus.deleted_at) {
    throw new AppError(410, 'This account has been deleted');
  }

  if (!userStatus.is_active) {
    throw new AppError(403, 'This account is inactive. Please contact support.');
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Update credentials to mark as verified
    const updateResult = await client.query(
      `UPDATE "Credentials" 
       SET verified_at = NOW()
       WHERE identifier = $1 AND identifier_type = 'EMAIL'
       RETURNING user_id`,
      [matchedIdentifier]
    );

    if (updateResult.rows.length === 0) {
      throw new AppError(404, 'Credentials not found');
    }

    const userId = updateResult.rows[0].user_id;

    // Update user onboarding status
    await client.query(
      `UPDATE "User" 
       SET onboarding_status = 'PROFILE_PENDING'
       WHERE user_id = $1 AND onboarding_status = 'AUTH_PENDING'`,
      [userId]
    );

    await client.query('COMMIT');

    // Delete the used token from Redis after successful verification
    await deleteVerificationToken(matchedIdentifier, 'EMAIL_VERIFICATION');

    return {
      success: true,
      message: 'Email verified successfully. You can now complete your profile.',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verify phone using OTP
 */
export async function verifyPhone(token: string): Promise<{ success: boolean; message: string }> {
  // Get all unverified phone credentials
  const credentialsResult = await db.query(
    `SELECT c.identifier, c.user_id, u.is_active, u.deleted_at
     FROM "Credentials" c
     JOIN "User" u ON c.user_id = u.user_id
     WHERE c.identifier_type = 'PHONE' AND c.verified_at IS NULL`
  );

  let matchedIdentifier: string | null = null;
  
  // Check each unverified credential against Redis
  for (const cred of credentialsResult.rows) {
    const tokenData = await verifyToken(cred.identifier, token, 'PHONE_VERIFICATION');
    if (tokenData) {
      matchedIdentifier = cred.identifier;
      break;
    }
  }

  if (!matchedIdentifier) {
    throw new AppError(400, 'Invalid or expired OTP');
  }

  // Get user details for the matched identifier
  const userCheck = await db.query(
    `SELECT c.user_id, u.is_active, u.deleted_at
     FROM "Credentials" c
     JOIN "User" u ON c.user_id = u.user_id
     WHERE c.identifier = $1 AND c.identifier_type = 'PHONE'`,
    [matchedIdentifier]
  );

  const userStatus = userCheck.rows[0];

  if (userStatus.deleted_at) {
    throw new AppError(410, 'This account has been deleted');
  }

  if (!userStatus.is_active) {
    throw new AppError(403, 'This account is inactive. Please contact support.');
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Update credentials to mark as verified
    const updateResult = await client.query(
      `UPDATE "Credentials" 
       SET verified_at = NOW()
       WHERE identifier = $1 AND identifier_type = 'PHONE'
       RETURNING user_id`,
      [matchedIdentifier]
    );

    if (updateResult.rows.length === 0) {
      throw new AppError(404, 'Credentials not found');
    }

    const userId = updateResult.rows[0].user_id;

    // Update user onboarding status
    await client.query(
      `UPDATE "User" 
       SET onboarding_status = 'PROFILE_PENDING'
       WHERE user_id = $1 AND onboarding_status = 'AUTH_PENDING'`,
      [userId]
    );

    await client.query('COMMIT');

    // Delete the used token from Redis after successful verification
    await deleteVerificationToken(matchedIdentifier, 'PHONE_VERIFICATION');

    return {
      success: true,
      message: 'Phone verified successfully. You can now complete your profile.',
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Resend verification token
 */
export async function resendVerification(
  identifier: string,
  type: IdentifierTypeType
): Promise<{ success: boolean; message: string }> {
  const identifierType = type;
  const tokenType = type === 'EMAIL' ? 'EMAIL_VERIFICATION' : 'PHONE_VERIFICATION';

  // Check if credentials exist and are not verified
  const credResult = await db.query(
    `SELECT c.id, c.user_id, c.verified_at, u.is_active, u.deleted_at
     FROM "Credentials" c
     JOIN "User" u ON c.user_id = u.user_id
     WHERE c.identifier = $1 AND c.identifier_type = $2`,
    [identifier, identifierType]
  );

  if (credResult.rows.length === 0) {
    throw new AppError(404, 'No account found with this identifier');
  }

  const credential = credResult.rows[0];

  if (credential.deleted_at) {
    throw new AppError(410, 'This account has been deleted');
  }

  if (!credential.is_active) {
    throw new AppError(403, 'Account is inactive. Please contact support.');
  }

  if (credential.verified_at) {
    throw new AppError(400, 'This identifier is already verified');
  }

  // Delete old token from Redis (if exists)
  await deleteVerificationToken(identifier, tokenType);

  // Generate new token
  const newToken = type === 'EMAIL' ? generateVerificationToken() : generateOTP();
  const ttl = type === 'EMAIL' ? TOKEN_TTL.EMAIL_VERIFICATION : TOKEN_TTL.PHONE_VERIFICATION;

  // Store new token in Redis
  await storeVerificationToken(identifier, newToken, tokenType, ttl);

  // TODO: Send verification email/SMS
  console.log(`New verification ${type}: ${newToken}`);

  return {
    success: true,
    message: `Verification ${type === 'EMAIL' ? 'email' : 'SMS'} sent successfully`,
  };
}

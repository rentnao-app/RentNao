/**
 * Verification service
 * Handles email and phone verification operations
 */

import { db } from '@/db/client';
import { AppError } from '@/middlewares/error-handler';
import { generateVerificationToken, generateOTP } from '../utils/token-generator';
import {
  deleteVerificationToken,
  getVerificationTokenTTL,
  storeVerificationToken,
  verifyToken,
} from './token-storage.service';
import {
  clearPendingPhoneVerification,
  getOtpRateResetSeconds,
  getPendingPhoneVerification,
  registerOtpRequest,
  setPendingPhoneVerification,
} from './otp-cache.service';
import { sendPhoneOtp } from './sms.service';
import { TOKEN_TTL } from '../config/token-ttl';
import type { IdentifierTypeType } from '@/types/enums';

type PhoneVerificationResult = {
  phone: string;
  message: string;
  alreadySent?: boolean;
  otpTtlSeconds?: number;
  rateResetSeconds?: number;
};

async function loadUserForPhoneVerification(userId: string) {
  const userResult = await db.query(
    `SELECT user_id, onboarding_status, is_active, deleted_at
     FROM "User"
     WHERE user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const user = userResult.rows[0];
  if (user.deleted_at) {
    throw new AppError(410, 'This account has been deleted');
  }
  if (!user.is_active) {
    throw new AppError(403, 'This account is inactive. Please contact support.');
  }
  if (user.onboarding_status === 'COMPLETED') {
    throw new AppError(409, 'Phone verification cannot be restarted for completed onboarding');
  }

  return user;
}

async function ensurePhoneIsAvailable(userId: string, phone: string) {
  const ownerByCredential = await db.query(
    `SELECT user_id
     FROM "Credentials"
     WHERE identifier_type = 'PHONE' AND identifier = $1
     LIMIT 1`,
    [phone]
  );

  if (ownerByCredential.rows[0] && ownerByCredential.rows[0].user_id !== userId) {
    throw new AppError(409, 'This phone number is already linked to another account');
  }

  const ownerByContact = await db.query(
    `SELECT user_id
     FROM "User"
     WHERE contact_phone = $1 AND user_id <> $2
     LIMIT 1`,
    [phone, userId]
  );

  if (ownerByContact.rows.length > 0) {
    throw new AppError(409, 'This phone number is already linked to another account');
  }
}

async function upsertPendingPhoneCredential(userId: string, phone: string) {
  const passwordSource = await db.query(
    `SELECT password_hash
     FROM "Credentials"
     WHERE user_id = $1
     ORDER BY verified_at DESC NULLS LAST, created_at ASC
     LIMIT 1`,
    [userId]
  );

  if (passwordSource.rows.length === 0) {
    throw new AppError(400, 'Cannot initialize phone verification without account credentials');
  }

  const existingPhoneCred = await db.query(
    `SELECT id, identifier, verified_at
     FROM "Credentials"
     WHERE user_id = $1 AND identifier_type = 'PHONE'
     LIMIT 1`,
    [userId]
  );

  if (existingPhoneCred.rows[0]?.verified_at && existingPhoneCred.rows[0].identifier === phone) {
    throw new AppError(409, 'Phone number is already verified for this account');
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    if (existingPhoneCred.rows.length > 0) {
      await client.query(
        `UPDATE "Credentials"
         SET identifier = $1, verified_at = NULL, updated_at = NOW()
         WHERE id = $2`,
        [phone, existingPhoneCred.rows[0].id]
      );
    } else {
      await client.query(
        `INSERT INTO "Credentials" (id, user_id, identifier, identifier_type, password_hash)
         VALUES (gen_random_uuid()::text, $1, $2, 'PHONE', $3)`,
        [userId, phone, passwordSource.rows[0].password_hash]
      );
    }

    await client.query(
      `UPDATE "User"
       SET contact_phone = $1,
           onboarding_status = CASE
             WHEN onboarding_status IN ('PHONE_REQUIRED', 'PHONE_VERIFICATION_PENDING', 'PROFILE_PENDING') THEN 'PHONE_VERIFICATION_PENDING'
             ELSE onboarding_status
           END,
           updated_at = NOW()
       WHERE user_id = $2`,
      [phone, userId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function sendPhoneVerificationOtp(userId: string, phone: string): Promise<PhoneVerificationResult> {
  const rateLimit = await registerOtpRequest(userId);
  if (!rateLimit.allowed) {
    throw new AppError(429, 'OTP request limit reached. Try again later.', true, {
      rateResetSeconds: rateLimit.resetSeconds,
    });
  }

  await deleteVerificationToken(phone, 'PHONE_VERIFICATION');
  const otp = generateOTP();
  await storeVerificationToken(phone, otp, 'PHONE_VERIFICATION', TOKEN_TTL.PHONE_VERIFICATION);
  await setPendingPhoneVerification(userId, phone, TOKEN_TTL.PHONE_VERIFICATION);
  await sendPhoneOtp({
    identifier: phone,
    otp,
    purpose: 'PHONE_VERIFICATION',
    ttlSeconds: TOKEN_TTL.PHONE_VERIFICATION,
  });

  return {
    phone,
    message: 'Verification SMS sent successfully',
    alreadySent: false,
    otpTtlSeconds: TOKEN_TTL.PHONE_VERIFICATION,
    rateResetSeconds: rateLimit.resetSeconds,
  };
}

export async function startPhoneVerification(
  userId: string,
  phone: string
): Promise<PhoneVerificationResult> {
  await loadUserForPhoneVerification(userId);
  await ensurePhoneIsAvailable(userId, phone);

  const pending = await getPendingPhoneVerification(userId);
  if (pending) {
    if (pending.phone !== phone) {
      throw new AppError(409, 'OTP already sent to another phone. Use change phone to update it.');
    }
    const otpTtlSeconds = await getVerificationTokenTTL(phone, 'PHONE_VERIFICATION');
    return {
      phone,
      message: 'OTP already sent. Please check your phone.',
      alreadySent: true,
      otpTtlSeconds: otpTtlSeconds > 0 ? otpTtlSeconds : 0,
      rateResetSeconds: await getOtpRateResetSeconds(userId),
    };
  }

  const existingOtpTtl = await getVerificationTokenTTL(phone, 'PHONE_VERIFICATION');
  if (existingOtpTtl > 0) {
    await setPendingPhoneVerification(userId, phone, existingOtpTtl);
    return {
      phone,
      message: 'OTP already sent. Please check your phone.',
      alreadySent: true,
      otpTtlSeconds: existingOtpTtl,
      rateResetSeconds: await getOtpRateResetSeconds(userId),
    };
  }

  await upsertPendingPhoneCredential(userId, phone);
  return sendPhoneVerificationOtp(userId, phone);
}

export async function changePhoneVerification(
  userId: string,
  phone: string
): Promise<PhoneVerificationResult> {
  await loadUserForPhoneVerification(userId);
  await ensurePhoneIsAvailable(userId, phone);

  const pending = await getPendingPhoneVerification(userId);
  if (pending?.phone === phone) {
    const otpTtlSeconds = await getVerificationTokenTTL(phone, 'PHONE_VERIFICATION');
    return {
      phone,
      message: 'OTP already sent. Please check your phone.',
      alreadySent: true,
      otpTtlSeconds: otpTtlSeconds > 0 ? otpTtlSeconds : 0,
      rateResetSeconds: await getOtpRateResetSeconds(userId),
    };
  }

  const existingOtpTtl = await getVerificationTokenTTL(phone, 'PHONE_VERIFICATION');
  if (existingOtpTtl > 0) {
    await setPendingPhoneVerification(userId, phone, existingOtpTtl);
    return {
      phone,
      message: 'OTP already sent. Please check your phone.',
      alreadySent: true,
      otpTtlSeconds: existingOtpTtl,
      rateResetSeconds: await getOtpRateResetSeconds(userId),
    };
  }

  if (pending?.phone) {
    await deleteVerificationToken(pending.phone, 'PHONE_VERIFICATION');
    await clearPendingPhoneVerification(userId);
  }

  await upsertPendingPhoneCredential(userId, phone);
  return sendPhoneVerificationOtp(userId, phone);
}

export async function resendPendingPhoneVerification(userId: string): Promise<PhoneVerificationResult> {
  await loadUserForPhoneVerification(userId);

  const pending = await getPendingPhoneVerification(userId);
  if (!pending?.phone) {
    throw new AppError(404, 'No pending phone verification found');
  }

  const result = await sendPhoneVerificationOtp(userId, pending.phone);
  return {
    ...result,
    message: 'Verification SMS resent successfully',
  };
}

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
export async function verifyPhone(
  userId: string,
  token: string
): Promise<{ success: boolean; message: string }> {
  const userResult = await db.query(
    `SELECT is_active, deleted_at
     FROM "User"
     WHERE user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const userStatus = userResult.rows[0];
  if (userStatus.deleted_at) {
    throw new AppError(410, 'This account has been deleted');
  }

  if (!userStatus.is_active) {
    throw new AppError(403, 'This account is inactive. Please contact support.');
  }

  const pending = await getPendingPhoneVerification(userId);
  let matchedIdentifier = pending?.phone || null;

  if (!matchedIdentifier) {
    const credResult = await db.query(
      `SELECT identifier
       FROM "Credentials"
       WHERE user_id = $1 AND identifier_type = 'PHONE' AND verified_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    matchedIdentifier = credResult.rows[0]?.identifier || null;
  }

  if (!matchedIdentifier) {
    throw new AppError(404, 'No pending phone verification found');
  }

  const tokenData = await verifyToken(matchedIdentifier, token, 'PHONE_VERIFICATION');
  if (!tokenData) {
    throw new AppError(400, 'Invalid or expired OTP');
  }

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Update credentials to mark as verified
    const updateResult = await client.query(
      `UPDATE "Credentials" 
       SET verified_at = NOW()
       WHERE user_id = $1 AND identifier_type = 'PHONE' AND identifier = $2
       RETURNING user_id`,
      [userId, matchedIdentifier]
    );

    if (updateResult.rows.length === 0) {
      throw new AppError(404, 'Credentials not found');
    }

    // Phone verification unlocks profile completion stage.
    await client.query(
      `UPDATE "User"
       SET contact_phone = COALESCE(contact_phone, $1),
           onboarding_status = CASE
             WHEN onboarding_status IN ('PHONE_REQUIRED', 'PHONE_VERIFICATION_PENDING') THEN 'PROFILE_PENDING'
             ELSE onboarding_status
           END,
           updated_at = NOW()
       WHERE user_id = $2`,
      [matchedIdentifier, userId]
    );

    await client.query('COMMIT');

    // Delete the used token from Redis after successful verification
    await deleteVerificationToken(matchedIdentifier, 'PHONE_VERIFICATION');
    await clearPendingPhoneVerification(userId);

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
  if (type !== 'EMAIL') {
    throw new AppError(400, 'Use /auth/phone/resend to resend phone OTP');
  }

  const identifierType = 'EMAIL';
  const tokenType = 'EMAIL_VERIFICATION';

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
  const newToken = generateVerificationToken();
  const ttl = TOKEN_TTL.EMAIL_VERIFICATION;

  // Store new token in Redis
  await storeVerificationToken(identifier, newToken, tokenType, ttl);

  // TODO: Send verification email
  console.log(`New verification email token: ${newToken}`);

  return {
    success: true,
    message: 'Verification email sent successfully',
  };
}

export async function getPendingPhoneVerificationStatus(userId: string): Promise<{
  exists: boolean;
  phone?: string;
  otpTtlSeconds?: number;
  rateResetSeconds?: number;
}> {
  const pending = await getPendingPhoneVerification(userId);
  if (!pending) {
    return { exists: false };
  }

  const otpTtlSeconds = await getVerificationTokenTTL(pending.phone, 'PHONE_VERIFICATION');
  const rateResetSeconds = await getOtpRateResetSeconds(userId);

  return {
    exists: true,
    phone: pending.phone,
    otpTtlSeconds: otpTtlSeconds > 0 ? otpTtlSeconds : 0,
    rateResetSeconds,
  };
}

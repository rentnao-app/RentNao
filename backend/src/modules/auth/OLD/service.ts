/**
 * Authentication service layer
 * Handles all business logic and database operations for auth
 */

import { db } from '@/db/client';
import { AppError } from '@/middlewares/error-handler';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { generateVerificationToken, generateOTP, generateSessionToken, getTokenExpiry } from '../utils/token-generator';
import type { RegisterInput, LoginInput } from '../schemas';
import {
  type UserRoleType,
  type OnboardingStatusType,
  type VerificationType,
  type IdentifierTypeType,
  type VerificationTokenTypeType,
  IdentifierType,
} from '@/types/enums';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserWithTokens {
  user: {
    userId: string;
    role: UserRoleType;
    onboardingStatus: OnboardingStatusType;
    contactEmail: string | null;
    contactPhone: string | null;
    verificationStatus: VerificationType;
    isActive: boolean;
    createdAt: Date;
  };
  tokens: AuthTokens;
  needsVerification: boolean;
}

/**
 * Register a new user
 */
export async function registerUser(input: RegisterInput): Promise<UserWithTokens> {
  const { identifier, identifierType, password, role } = input;

  // Check if user already exists
  const existingCredential = await db.query(
    `SELECT c.id, c.user_id, c.verified_at, u.is_active, u.deleted_at 
     FROM "Credentials" c
     JOIN "User" u ON c.user_id = u.user_id
     WHERE c.identifier_type = $1 AND c.identifier = $2`,
    [identifierType, identifier]
  );

  if (existingCredential.rows.length > 0) {
    const existing = existingCredential.rows[0];
    
    // Check if account is deleted
    if (existing.deleted_at) {
      throw new AppError(410, 'An account with this identifier was previously deleted. Please contact support.');
    }
    
    // Check if account is inactive
    if (!existing.is_active) {
      throw new AppError(403, 'This account is inactive. Please contact support.');
    }
    
    if (existing.verified_at) {
      throw new AppError(409, 'An account with this identifier already exists');
    } else {
      throw new AppError(409, 'An account with this identifier exists but is not verified. Please verify your account or use a different identifier.');
    }
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Start transaction
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    // Create user
    const userResult = await client.query(
      `INSERT INTO "User" (user_id, role, onboarding_status, is_active)
       VALUES (gen_random_uuid()::text, $1, 'AUTH_PENDING', true)
       RETURNING user_id, role, onboarding_status, contact_email, contact_phone, verification_status, is_active, created_at`,
      [role]
    );

    const user = userResult.rows[0];

    // Create credentials
    await client.query(
      `INSERT INTO "Credentials" (id, user_id, identifier, identifier_type, password_hash)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
      [user.user_id, identifier, identifierType, passwordHash]
    );

    // Update contact info on user
    const contactField = identifierType === 'EMAIL' ? 'contact_email' : 'contact_phone';
    await client.query(
      `UPDATE "User" SET ${contactField} = $1 WHERE user_id = $2`,
      [identifier, user.user_id]
    );

    // Generate verification token
    const verificationToken = identifierType === 'EMAIL' 
      ? generateVerificationToken() 
      : generateOTP();

    const tokenType = identifierType === 'EMAIL' 
      ? 'EMAIL_VERIFICATION' 
      : 'PHONE_VERIFICATION';

    const expiresAt = getTokenExpiry(24); // 24 hours

    await client.query(
      `INSERT INTO "VerificationToken" (id, identifier, token, type, expires_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
      [identifier, verificationToken, tokenType, expiresAt]
    );

    await client.query('COMMIT');

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      userId: user.user_id,
      role: user.role,
      onboardingStatus: user.onboarding_status,
    });

    const refreshToken = generateRefreshToken(user.user_id);

    // TODO: Send verification email/SMS
    console.log(`Verification ${identifierType.toLowerCase()}: ${verificationToken}`);

    return {
      user: {
        userId: user.user_id,
        role: user.role,
        onboardingStatus: user.onboarding_status,
        contactEmail: identifierType === 'EMAIL' ? identifier : null,
        contactPhone: identifierType === 'PHONE' ? identifier : null,
        verificationStatus: user.verification_status,
        isActive: user.is_active,
        createdAt: user.created_at,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
      needsVerification: true,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Login user with identifier (email or phone) and password
 */
export async function loginUser(input: LoginInput): Promise<UserWithTokens> {
  const { identifier, password, rememberMe = false } = input;

  // Find user by identifier (could be email or phone)
  const userResult = await db.query(
    `SELECT 
      u.user_id, u.role, u.onboarding_status, u.contact_email, u.contact_phone, 
      u.verification_status, u.is_active, u.created_at, u.deleted_at,
      c.password_hash, c.verified_at, c.identifier_type
     FROM "User" u
     JOIN "Credentials" c ON u.user_id = c.user_id
     WHERE (c.identifier = $1 OR u.contact_email = $1 OR u.contact_phone = $1)
     LIMIT 1`,
    [identifier]
  );

  // Generic error message to prevent user enumeration
  const invalidCredentialsError = new AppError(401, 'Invalid credentials');

  if (userResult.rows.length === 0) {
    throw invalidCredentialsError;
  }

  const user = userResult.rows[0];

  // Check if account is deleted
  if (user.deleted_at) {
    throw new AppError(403, 'This account has been deleted. Please contact support.');
  }

  // Check if account is inactive
  if (!user.is_active) {
    throw new AppError(403, 'This account is inactive. Please contact support.');
  }

  // Check if credentials are verified
  if (!user.verified_at) {
    throw new AppError(401, 'Please verify your email or phone number before logging in.');
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    // TODO: Log failed login attempt for security monitoring
    throw invalidCredentialsError;
  }

  // Update last login timestamp
  await db.query(
    `UPDATE "User" SET last_login_at = NOW() WHERE user_id = $1`,
    [user.user_id]
  );

  // Generate JWT tokens
  const accessToken = generateAccessToken({
    userId: user.user_id,
    role: user.role,
    onboardingStatus: user.onboarding_status,
  });

  // For rememberMe, we could extend refresh token expiry in the future
  // Currently using default 30 days for all refresh tokens
  const refreshToken = generateRefreshToken(user.user_id);

  return {
    user: {
      userId: user.user_id,
      role: user.role,
      onboardingStatus: user.onboarding_status,
      contactEmail: user.contact_email,
      contactPhone: user.contact_phone,
      verificationStatus: user.verification_status,
      isActive: user.is_active,
      createdAt: user.created_at,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
    needsVerification: false,
  };
}


/**
 * Verify email using token
 */
export async function verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Find and validate token
    const tokenResult = await client.query(
      `SELECT vt.id, vt.identifier, vt.expires_at 
       FROM "VerificationToken" vt
       WHERE vt.token = $1 AND vt.type = 'EMAIL_VERIFICATION'`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      throw new AppError(400, 'Invalid or expired verification token');
    }

    const verificationToken = tokenResult.rows[0];

    // Check if expired
    if (new Date() > new Date(verificationToken.expires_at)) {
      throw new AppError(410, 'Verification token has expired. Please request a new one.');
    }

    // Check if user account is active and not deleted
    const userCheck = await client.query(
      `SELECT c.user_id, u.is_active, u.deleted_at
       FROM "Credentials" c
       JOIN "User" u ON c.user_id = u.user_id
       WHERE c.identifier = $1 AND c.identifier_type = 'EMAIL'`,
      [verificationToken.identifier]
    );

    if (userCheck.rows.length === 0) {
      throw new AppError(404, 'Account not found');
    }

    const userStatus = userCheck.rows[0];

    if (userStatus.deleted_at) {
      throw new AppError(410, 'This account has been deleted');
    }

    if (!userStatus.is_active) {
      throw new AppError(403, 'This account is inactive. Please contact support.');
    }

    // Update credentials to mark as verified
    const updateResult = await client.query(
      `UPDATE "Credentials" 
       SET verified_at = NOW()
       WHERE identifier = $1 AND identifier_type = 'EMAIL'
       RETURNING user_id`,
      [verificationToken.identifier]
    );

    if (updateResult.rows.length === 0) {
      throw new AppError(404, 'Credentials not found');
    }

    const userId = updateResult.rows[0].user_id;

    // Update user onboarding status
    await client.query(
      `UPDATE "User" 
       SET onboarding_status = 'PROFILE_PENDING', verification_status = 'ACCEPTED'
       WHERE user_id = $1 AND onboarding_status = 'AUTH_PENDING'`,
      [userId]
    );

    // Delete the used token
    await client.query(
      `DELETE FROM "VerificationToken" WHERE id = $1`,
      [verificationToken.id]
    );

    await client.query('COMMIT');

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
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Find and validate token
    const tokenResult = await client.query(
      `SELECT vt.id, vt.identifier, vt.expires_at 
       FROM "VerificationToken" vt
       WHERE vt.token = $1 AND vt.type = 'PHONE_VERIFICATION'`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      throw new AppError(400, 'Invalid or expired OTP');
    }

    const verificationToken = tokenResult.rows[0];

    // Check if expired
    if (new Date() > new Date(verificationToken.expires_at)) {
      throw new AppError(410, 'OTP has expired. Please request a new one.');
    }

    // Check if user account is active and not deleted
    const userCheck = await client.query(
      `SELECT c.user_id, u.is_active, u.deleted_at
       FROM "Credentials" c
       JOIN "User" u ON c.user_id = u.user_id
       WHERE c.identifier = $1 AND c.identifier_type = 'PHONE'`,
      [verificationToken.identifier]
    );

    if (userCheck.rows.length === 0) {
      throw new AppError(404, 'Account not found');
    }

    const userStatus = userCheck.rows[0];

    if (userStatus.deleted_at) {
      throw new AppError(410, 'This account has been deleted');
    }

    if (!userStatus.is_active) {
      throw new AppError(403, 'This account is inactive. Please contact support.');
    }

    // Update credentials to mark as verified
    const updateResult = await client.query(
      `UPDATE "Credentials" 
       SET verified_at = NOW()
       WHERE identifier = $1 AND identifier_type = 'PHONE'
       RETURNING user_id`,
      [verificationToken.identifier]
    );

    if (updateResult.rows.length === 0) {
      throw new AppError(404, 'Credentials not found');
    }

    const userId = updateResult.rows[0].user_id;

    // Update user onboarding status
    await client.query(
      `UPDATE "User" 
       SET onboarding_status = 'PROFILE_PENDING', verification_status = 'ACCEPTED'
       WHERE user_id = $1 AND onboarding_status = 'AUTH_PENDING'`,
      [userId]
    );

    // Delete the used token
    await client.query(
      `DELETE FROM "VerificationToken" WHERE id = $1`,
      [verificationToken.id]
    );

    await client.query('COMMIT');

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

  // Delete old tokens for this identifier
  await db.query(
    `DELETE FROM "VerificationToken" 
     WHERE identifier = $1 AND type = $2`,
    [identifier, tokenType]
  );

  // Generate new token
  const newToken = type === 'EMAIL' ? generateVerificationToken() : generateOTP();
  const expiresAt = getTokenExpiry(24);

  await db.query(
    `INSERT INTO "VerificationToken" (id, identifier, token, type, expires_at)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
    [identifier, newToken, tokenType, expiresAt]
  );

  // TODO: Send verification email/SMS
  console.log(`New verification ${type}: ${newToken}`);

  return {
    success: true,
    message: `Verification ${type === 'EMAIL' ? 'email' : 'SMS'} sent successfully`,
  };
}

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

  // Delete old password reset tokens for this identifier
  await db.query(
    `DELETE FROM "VerificationToken" 
     WHERE identifier = $1 AND type = $2`,
    [identifier, tokenType]
  );

  // Generate new token
  const resetToken = type === 'EMAIL' ? generateVerificationToken() : generateOTP();
  const expiresAt = getTokenExpiry(1); // 1 hour for password reset

  await db.query(
    `INSERT INTO "VerificationToken" (id, identifier, token, type, expires_at)
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
    [identifier, resetToken, tokenType, expiresAt]
  );

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
  // Find and validate token
  const tokenResult = await db.query(
    `SELECT vt.id, vt.identifier, vt.expires_at 
     FROM "VerificationToken" vt
     WHERE vt.token = $1 AND vt.type = 'PASSWORD_RESET'`,
    [token]
  );

  if (tokenResult.rows.length === 0) {
    throw new AppError(400, 'Invalid or expired password reset token');
  }

  const resetToken = tokenResult.rows[0];

  // Check if expired
  if (new Date() > new Date(resetToken.expires_at)) {
    throw new AppError(410, 'Password reset token has expired. Please request a new one.');
  }

  // Check if associated user is active and not deleted
  const userCheck = await db.query(
    `SELECT u.is_active, u.deleted_at
     FROM "Credentials" c
     JOIN "User" u ON c.user_id = u.user_id
     WHERE c.identifier = $1`,
    [resetToken.identifier]
  );

  if (userCheck.rows.length === 0) {
    throw new AppError(404, 'Account not found');
  }

  const userStatus = userCheck.rows[0];

  if (userStatus.deleted_at) {
    throw new AppError(410, 'This account has been deleted');
  }

  if (!userStatus.is_active) {
    throw new AppError(403, 'This account is inactive. Please contact support.');
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
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    // Find and validate token
    const tokenResult = await client.query(
      `SELECT vt.id, vt.identifier, vt.expires_at 
       FROM "VerificationToken" vt
       WHERE vt.token = $1 AND vt.type = 'PASSWORD_RESET'`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      throw new AppError(400, 'Invalid or expired password reset token');
    }

    const resetToken = tokenResult.rows[0];

    // Check if expired
    if (new Date() > new Date(resetToken.expires_at)) {
      throw new AppError(410, 'Password reset token has expired. Please request a new one.');
    }

    // Find credentials and check user status
    const credResult = await client.query(
      `SELECT c.id, c.user_id, c.identifier_type, u.is_active, u.deleted_at
       FROM "Credentials" c
       JOIN "User" u ON c.user_id = u.user_id
       WHERE c.identifier = $1`,
      [resetToken.identifier]
    );

    if (credResult.rows.length === 0) {
      throw new AppError(404, 'Account not found');
    }

    const credential = credResult.rows[0];

    // Check if user account is active and not deleted
    if (credential.deleted_at) {
      throw new AppError(410, 'This account has been deleted');
    }

    if (!credential.is_active) {
      throw new AppError(403, 'This account is inactive. Please contact support.');
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await client.query(
      `UPDATE "Credentials" 
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2`,
      [newPasswordHash, credential.id]
    );

    // Delete the used token
    await client.query(
      `DELETE FROM "VerificationToken" WHERE id = $1`,
      [resetToken.id]
    );

    // TODO: Invalidate all existing sessions for this user
    await client.query(
      `DELETE FROM "Session" WHERE user_id = $1`,
      [credential.user_id]
    );

    await client.query('COMMIT');

    console.log(`Password reset successful for user: ${credential.user_id}`);

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

/**
 * Authentication service
 * Handles user registration and login operations
 */

import { db } from '@/db/client';
import { AppError } from '@/middlewares/error-handler';
import { InvalidTokenError, TokenExpiredError } from '@/errors';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  getRemainingTokenTtlSeconds,
  blacklistAccessToken,
} from '@/security';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateVerificationToken, generateOTP } from '../utils/token-generator';
import { storeVerificationToken } from './token-storage.service';
import { sendPhoneOtp } from './sms.service';
import { TOKEN_TTL } from '../config/token-ttl';
import type { RegisterInput, LoginInput } from '../schemas';
import type { UserWithTokens } from '../types/auth.types';

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
       RETURNING user_id, role, onboarding_status, kyc_verification_status, contact_email, contact_phone, is_active, created_at`,
      [role]
    );

    const user = userResult.rows[0];

    // Create credentials
    await client.query(
      `INSERT INTO "Credentials" (id, user_id, identifier, identifier_type, password_hash)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4)`,
      [user.user_id, identifier, identifierType, passwordHash]
    );

    if (role === 'TENANT' || role === 'OWNER') {
      await client.query(
        `INSERT INTO "WalletAccount" (id, user_id, status, currency, available_balance)
         VALUES (gen_random_uuid()::text, $1, 'ACTIVE', 'BDT', 0)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.user_id]
      );
    }

    // Update contact info on user
    const contactField = identifierType === 'EMAIL' ? 'contact_email' : 'contact_phone';
    await client.query(
      `UPDATE "User" SET ${contactField} = $1 WHERE user_id = $2`,
      [identifier, user.user_id]
    );

    await client.query('COMMIT');

    // Generate verification token
    const verificationToken = identifierType === 'EMAIL' 
      ? generateVerificationToken() 
      : generateOTP();

    const tokenType = identifierType === 'EMAIL' 
      ? 'EMAIL_VERIFICATION' 
      : 'PHONE_VERIFICATION';

    const ttl = identifierType === 'EMAIL' 
      ? TOKEN_TTL.EMAIL_VERIFICATION 
      : TOKEN_TTL.PHONE_VERIFICATION;

    // Store verification token in Redis
    await storeVerificationToken(identifier, verificationToken, tokenType, ttl);

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      userId: user.user_id,
      role: user.role,
      onboardingStatus: user.onboarding_status,
      kycVerificationStatus: user.kyc_verification_status,
    });

    const refreshToken = generateRefreshToken(user.user_id);

    // Send verification token
    if (identifierType === 'PHONE') {
      await sendPhoneOtp({
        identifier,
        otp: verificationToken,
        purpose: 'PHONE_VERIFICATION',
        ttlSeconds: ttl,
      });
    } else {
      // TODO: Send verification email
      console.log(`Verification email: ${verificationToken}`);
    }

    return {
      user: {
        userId: user.user_id,
        role: user.role,
        onboardingStatus: user.onboarding_status,
        contactEmail: identifierType === 'EMAIL' ? identifier : null,
        contactPhone: identifierType === 'PHONE' ? identifier : null,
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
      u.kyc_verification_status, u.is_active, u.created_at, u.deleted_at,
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
    kycVerificationStatus: user.kyc_verification_status,
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
 * Logout user by blacklisting current access token in Redis
 */
export async function logoutUser(accessToken: string): Promise<void> {
  let payload;

  try {
    payload = verifyAccessToken(accessToken);
  } catch (error: any) {
    if (error.message?.includes('expired')) {
      throw new TokenExpiredError();
    }
    throw new InvalidTokenError();
  }

  const ttlSeconds = getRemainingTokenTtlSeconds(payload);

  if (ttlSeconds <= 0) {
    throw new TokenExpiredError();
  }

  await blacklistAccessToken(accessToken, ttlSeconds, payload.jti);
}

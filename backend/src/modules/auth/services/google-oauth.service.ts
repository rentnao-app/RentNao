/**
 * Google OAuth service
 * Handles Google OAuth token exchange, user resolution, and account management
 */

import { randomUUID } from 'crypto';
import { env } from '@/config/env';
import { db } from '@/db/client';
import { AppError } from '@/middlewares/error-handler';
import { generateAccessToken, generateRefreshToken, signInternalToken, verifyInternalToken } from '@/security';
import { hashPassword } from '../utils/password';

// ============================================================================
// Types
// ============================================================================

export type OAuthMode = 'login' | 'signup';

export type GoogleStatePayload = {
  redirectUri: string;
  mode: OAuthMode;
  role: string;
  nonce: string;
};

export type UserRow = {
  user_id: string;
  role: string;
  onboarding_status: string;
  kyc_verification_status: string;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: Date | string;
};

export type UserMatchResult = {
  user: UserRow;
  matchedBy: 'provider' | 'email';
};

export type GoogleIdClaims = {
  sub: string;
  email: string | undefined;
  emailVerified: boolean;
  name: string | undefined;
  picture: string | undefined;
};

export type GoogleTokenSet = {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  expiresIn: number | undefined;
  scope: string | undefined;
  tokenType: string | undefined;
  idToken: string | undefined;
};

// ============================================================================
// Environment Helpers
// ============================================================================

export function getRequiredGoogleEnv() {
  const clientId = env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new AppError(
      501,
      'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend .env'
    );
  }
  return { clientId, clientSecret };
}

export function getGoogleCallbackUrl(requestUrl: string) {
  const configuredOrigin = env.PUBLIC_API_ORIGIN?.trim();
  if (configuredOrigin) {
    return `${new URL(configuredOrigin).origin}/auth/google/callback`;
  }
  return `${new URL(requestUrl).origin}/auth/google/callback`;
}

// ============================================================================
// URL Helpers
// ============================================================================

export function buildRedirect(url: string, params: Record<string, string | undefined | null>) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    u.searchParams.set(k, v);
  }
  return u.toString();
}

// ============================================================================
// State Token
// ============================================================================

export function createStateToken(redirectUri: string, mode: OAuthMode, role: string): string {
  const state: GoogleStatePayload = {
    redirectUri,
    mode,
    role,
    nonce: randomUUID(),
  };
  return signInternalToken(state, '10m');
}

export function verifyStateToken(stateToken: string): GoogleStatePayload {
  return verifyInternalToken<GoogleStatePayload>(stateToken);
}

// ============================================================================
// Google API Integration
// ============================================================================

export async function exchangeCodeForTokens(args: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<GoogleTokenSet> {
  const body = new URLSearchParams({
    code: args.code,
    client_id: args.clientId,
    client_secret: args.clientSecret,
    redirect_uri: args.redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    throw new AppError(
      502,
      `Google token exchange failed: ${data?.error_description || data?.error || res.statusText}`
    );
  }

  return {
    accessToken: data.access_token as string | undefined,
    refreshToken: data.refresh_token as string | undefined,
    expiresIn: data.expires_in as number | undefined,
    scope: data.scope as string | undefined,
    tokenType: data.token_type as string | undefined,
    idToken: data.id_token as string | undefined,
  };
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdClaims> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    throw new AppError(
      401,
      `Google ID token verification failed: ${data?.error_description || data?.error || res.statusText}`
    );
  }

  return {
    sub: data.sub as string,
    email: data.email as string | undefined,
    emailVerified: data.email_verified === 'true' || data.email_verified === true,
    name: data.name as string | undefined,
    picture: data.picture as string | undefined,
  };
}

// ============================================================================
// User Resolution & Management
// ============================================================================

export async function findUserForGoogle(
  sub: string,
  email?: string
): Promise<UserMatchResult | null> {
  const byProviderUserId = await db.query(
    `SELECT u.user_id, u.role, u.onboarding_status, u.kyc_verification_status, u.contact_email, u.contact_phone, u.is_active, u.created_at
     FROM "OAuthAccount" oa
     JOIN "User" u ON u.user_id = oa.user_id
     WHERE oa.provider = 'GOOGLE' AND oa.provider_user_id = $1
     LIMIT 1`,
    [sub]
  );
  if (byProviderUserId.rows[0]) {
    return { user: byProviderUserId.rows[0] as UserRow, matchedBy: 'provider' };
  }

  if (!email) return null;

  const byEmail = await db.query(
    `SELECT u.user_id, u.role, u.onboarding_status, u.kyc_verification_status, u.contact_email, u.contact_phone, u.is_active, u.created_at
     FROM "User" u
     WHERE u.contact_email = $1
     LIMIT 1`,
    [email]
  );
  if (!byEmail.rows[0]) return null;
  return { user: byEmail.rows[0] as UserRow, matchedBy: 'email' };
}

export function normalizeRequestedRole(role: string): 'OWNER' | 'TENANT' | null {
  const r = String(role || '').toUpperCase();
  if (r === 'OWNER' || r === 'TENANT') return r;
  return null;
}

export async function canSwitchRoleForGoogleSignup(userId: string): Promise<boolean> {
  const [ownerProfileRes, tenantProfileRes] = await Promise.all([
    db.query(`SELECT 1 FROM "OwnerProfile" WHERE user_id = $1 LIMIT 1`, [userId]),
    db.query(`SELECT 1 FROM "TenantProfile" WHERE user_id = $1 LIMIT 1`, [userId]),
  ]);
  return ownerProfileRes.rowCount === 0 && tenantProfileRes.rowCount === 0;
}

export async function switchUserRole(
  userId: string,
  targetRole: 'OWNER' | 'TENANT'
): Promise<UserRow | null> {
  const res = await db.query(
    `UPDATE "User"
     SET role = $2, updated_at = NOW()
     WHERE user_id = $1
     RETURNING user_id, role, onboarding_status, kyc_verification_status, contact_email, contact_phone, is_active, created_at`,
    [userId, targetRole]
  );
  return (res.rows[0] as UserRow | undefined) || null;
}

export async function upsertGoogleAccount(args: {
  userId: string;
  sub: string;
  email?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  tokenExpiresAt?: Date | null;
  tokenType?: string;
  scope?: string;
  idToken?: string;
}): Promise<void> {
  await db.query(
    `INSERT INTO "OAuthAccount" (
      id, user_id, provider, provider_user_id, email,
      access_token, refresh_token, token_expires_at, token_type, scope, id_token,
      verified_at
    ) VALUES (
      gen_random_uuid()::text, $1, 'GOOGLE', $2, $3,
      $4, $5, $6, $7, $8, $9,
      NOW()
    )
    ON CONFLICT (provider, provider_user_id)
    DO UPDATE SET
      email = EXCLUDED.email,
      access_token = EXCLUDED.access_token,
      refresh_token = COALESCE(EXCLUDED.refresh_token, "OAuthAccount".refresh_token),
      token_expires_at = EXCLUDED.token_expires_at,
      token_type = EXCLUDED.token_type,
      scope = EXCLUDED.scope,
      id_token = EXCLUDED.id_token,
      updated_at = NOW()`,
    [
      args.userId,
      args.sub,
      args.email ?? null,
      args.googleAccessToken ?? null,
      args.googleRefreshToken ?? null,
      args.tokenExpiresAt ?? null,
      args.tokenType ?? null,
      args.scope ?? null,
      args.idToken ?? null,
    ]
  );
}

export async function createUserFromGoogle(args: {
  email: string;
  role: string;
}): Promise<UserRow> {
  const client = await db.connect();
  const role = ['TENANT', 'OWNER', 'ADMIN'].includes(args.role) ? args.role : 'TENANT';
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO "User" (user_id, role, onboarding_status, kyc_verification_status, contact_email, is_active)
       VALUES (gen_random_uuid()::text, $1, 'PHONE_REQUIRED', 'PENDING', $2, true)
       RETURNING user_id, role, onboarding_status, kyc_verification_status, contact_email, contact_phone, is_active, created_at`,
      [role, args.email]
    );
    const user = userResult.rows[0];

    const randomPassword = randomUUID();
    const passwordHash = await hashPassword(randomPassword);

    await client.query(
      `INSERT INTO "Credentials" (id, user_id, identifier, identifier_type, password_hash, verified_at)
       VALUES (gen_random_uuid()::text, $1, $2, 'EMAIL', $3, NOW())
       ON CONFLICT (identifier_type, identifier) DO NOTHING`,
      [user.user_id, args.email, passwordHash]
    );

    await client.query(
      `INSERT INTO "WalletAccount" (id, user_id, status, currency, available_balance)
       VALUES (gen_random_uuid()::text, $1, 'ACTIVE', 'BDT', 0)
       ON CONFLICT (user_id) DO NOTHING`,
      [user.user_id]
    );

    await client.query('COMMIT');
    return user;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// ============================================================================
// Response Formatting
// ============================================================================

export function toFrontendUser(row: any) {
  return {
    userId: row.user_id,
    role: row.role,
    onboardingStatus: row.onboarding_status,
    kycVerificationStatus: row.kyc_verification_status,
    contactEmail: row.contact_email ?? null,
    contactPhone: row.contact_phone ?? null,
    isActive: row.is_active,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

// ============================================================================
// Exchange Code
// ============================================================================

export function createExchangeCode(userRow: UserRow): string {
  const exchangePayload = {
    userId: userRow.user_id,
    role: userRow.role,
    onboardingStatus: userRow.onboarding_status,
    kycVerificationStatus: userRow.kyc_verification_status,
    contactEmail: userRow.contact_email,
    contactPhone: userRow.contact_phone,
    isActive: userRow.is_active,
    createdAt: userRow.created_at,
  };
  return signInternalToken(exchangePayload, '2m');
}

export function verifyExchangeCode(code: string): Record<string, unknown> {
  return verifyInternalToken(code);
}

export function generateTokensForUser(payload: any) {
  const accessToken = generateAccessToken({
    userId: payload.userId,
    role: payload.role,
    onboardingStatus: payload.onboardingStatus,
    kycVerificationStatus: payload.kycVerificationStatus,
  });
  const refreshToken = generateRefreshToken(payload.userId);

  const user = toFrontendUser({
    user_id: payload.userId,
    role: payload.role,
    onboarding_status: payload.onboardingStatus,
    kyc_verification_status: payload.kycVerificationStatus,
    contact_email: payload.contactEmail,
    contact_phone: payload.contactPhone,
    is_active: payload.isActive,
    created_at: payload.createdAt,
  });

  return { accessToken, refreshToken, user };
}

import type { OpenAPIHono } from '@hono/zod-openapi';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';
import { db } from '@/db/client';
import { AppError } from '@/middlewares/error-handler';
import { hashPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '@/security';
import { randomUUID } from 'crypto';

type OAuthMode = 'login' | 'signup';

type GoogleStatePayload = {
  redirectUri: string;
  mode: OAuthMode;
  role: string;
  nonce: string;
};

type UserRow = {
  user_id: string;
  role: string;
  onboarding_status: string;
  kyc_verification_status: string;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: Date | string;
};

type UserMatchResult = {
  user: UserRow;
  matchedBy: 'provider' | 'email';
};

function buildRedirect(url: string, params: Record<string, string | undefined | null>) {
  const u = new URL(url);
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    u.searchParams.set(k, v);
  }
  return u.toString();
}

function getRequiredGoogleEnv() {
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

function getGoogleCallbackUrl(requestUrl: string) {
  const configuredOrigin = env.PUBLIC_API_ORIGIN?.trim();
  if (configuredOrigin) {
    return `${new URL(configuredOrigin).origin}/auth/google/callback`;
  }
  return `${new URL(requestUrl).origin}/auth/google/callback`;
}

async function exchangeCodeForTokens(args: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}) {
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
    throw new AppError(502, `Google token exchange failed: ${data?.error_description || data?.error || res.statusText}`);
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

async function verifyGoogleIdToken(idToken: string) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  const data = (await res.json().catch(() => null)) as any;
  if (!res.ok) {
    throw new AppError(401, `Google ID token verification failed: ${data?.error_description || data?.error || res.statusText}`);
  }

  return {
    sub: data.sub as string,
    email: data.email as string | undefined,
    emailVerified: data.email_verified === 'true' || data.email_verified === true,
    name: data.name as string | undefined,
    picture: data.picture as string | undefined,
  };
}

function normalizeRequestedRole(role: string) {
  const r = String(role || '').toUpperCase();
  if (r === 'OWNER' || r === 'TENANT') return r;
  return null;
}

async function findUserForGoogle(sub: string, email?: string): Promise<UserMatchResult | null> {
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

async function canSwitchRoleForGoogleSignup(userId: string) {
  const [ownerProfileRes, tenantProfileRes] = await Promise.all([
    db.query(`SELECT 1 FROM "OwnerProfile" WHERE user_id = $1 LIMIT 1`, [userId]),
    db.query(`SELECT 1 FROM "TenantProfile" WHERE user_id = $1 LIMIT 1`, [userId]),
  ]);
  return ownerProfileRes.rowCount === 0 && tenantProfileRes.rowCount === 0;
}

async function switchUserRole(userId: string, targetRole: 'OWNER' | 'TENANT') {
  const res = await db.query(
    `UPDATE "User"
     SET role = $2, updated_at = NOW()
     WHERE user_id = $1
     RETURNING user_id, role, onboarding_status, kyc_verification_status, contact_email, contact_phone, is_active, created_at`,
    [userId, targetRole]
  );
  return (res.rows[0] as UserRow | undefined) || null;
}

async function upsertGoogleAccount(args: {
  userId: string;
  sub: string;
  email?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  tokenExpiresAt?: Date | null;
  tokenType?: string;
  scope?: string;
  idToken?: string;
}) {
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

async function createUserFromGoogle(args: { email: string; role: string }) {
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
       VALUES (gen_random_uuid()::text, $1, 'ACTIVE', 'BDT', 1000)
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

function toFrontendUser(row: any) {
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

/**
 * Register Google OAuth routes under /auth
 *
 * Frontend should point VITE_GOOGLE_AUTH_URL to:
 *   http://localhost:3000/auth/google
 *
 * Frontend passes:
 *   redirect_uri=<frontend_callback_url> (usually http://localhost:5173/auth/callback)
 *   mode=login|signup
 */
export function registerGoogleOAuthRoutes(app: OpenAPIHono) {
  /**
   * 1. Initiate Google OAuth
   */
  app.get('/google', async (c) => {
    const { clientId } = getRequiredGoogleEnv();

    const redirectUri = c.req.query('redirect_uri')?.trim();
    const modeRaw = (c.req.query('mode') || 'login').toLowerCase();
    const mode: OAuthMode = modeRaw === 'signup' ? 'signup' : 'login';
    const role = (c.req.query('role') || 'TENANT').toUpperCase();

    if (!redirectUri) {
      throw new AppError(400, 'Missing redirect_uri');
    }

    let parsedRedirect: URL;
    try {
      parsedRedirect = new URL(redirectUri);
    } catch {
      throw new AppError(400, 'Invalid redirect_uri');
    }

    const callbackUrl = getGoogleCallbackUrl(c.req.url);

    const state: GoogleStatePayload = {
      redirectUri: parsedRedirect.toString(),
      mode,
      role,
      nonce: randomUUID(),
    };

    const stateToken = jwt.sign(state, env.JWT_SECRET, { expiresIn: '10m' });

    const googleAuth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuth.searchParams.set('client_id', clientId);
    googleAuth.searchParams.set('redirect_uri', callbackUrl);
    googleAuth.searchParams.set('response_type', 'code');
    googleAuth.searchParams.set('scope', 'openid email profile');
    googleAuth.searchParams.set('state', stateToken);
    googleAuth.searchParams.set('access_type', 'offline');
    googleAuth.searchParams.set('prompt', 'consent');

    return c.redirect(googleAuth.toString(), 302);
  });

  /**
   * 2. Google Redirect Callback
   */
  app.get('/google/callback', async (c) => {
    const { clientId, clientSecret } = getRequiredGoogleEnv();

    const code = c.req.query('code');
    const stateToken = c.req.query('state');
    const googleError = c.req.query('error');

    if (googleError) {
      // If we can decode state, try to redirect user back; otherwise just return JSON.
      try {
        if (stateToken) {
          const decoded = jwt.verify(stateToken, env.JWT_SECRET) as GoogleStatePayload;
          return c.redirect(
            buildRedirect(decoded.redirectUri, { error: 'google_oauth_error', message: googleError }),
            302
          );
        }
      } catch {
        // ignore
      }
      return c.json({ success: false, error: googleError }, 401);
    }

    if (!code || !stateToken) {
      throw new AppError(400, 'Missing code or state');
    }

    const state = jwt.verify(stateToken, env.JWT_SECRET) as GoogleStatePayload;
    const callbackUrl = getGoogleCallbackUrl(c.req.url);

    const token = await exchangeCodeForTokens({
      code,
      redirectUri: callbackUrl,
      clientId,
      clientSecret,
    });

    if (!token.idToken) {
      return c.redirect(
        buildRedirect(state.redirectUri, {
          error: 'google_missing_id_token',
          message: 'Google OAuth did not return an id_token.',
        }),
        302
      );
    }

    const idClaims = await verifyGoogleIdToken(token.idToken);

    if (!idClaims.email || !idClaims.emailVerified) {
      return c.redirect(
        buildRedirect(state.redirectUri, {
          error: 'google_email_unverified',
          message: 'Google account email is missing or not verified.',
        }),
        302
      );
    }

    const found = await findUserForGoogle(idClaims.sub, idClaims.email);
    let userRow = found?.user || null;

    if (!userRow) {
      userRow = await createUserFromGoogle({
        email: idClaims.email,
        role: state.role,
      });
    } else if (state.mode === 'signup') {
      const requestedRole = normalizeRequestedRole(state.role);
      if (requestedRole && userRow.role !== requestedRole) {
        const safeToSwitch = await canSwitchRoleForGoogleSignup(userRow.user_id);
        if (!safeToSwitch) {
          return c.redirect(
            buildRedirect(state.redirectUri, {
              error: 'role_mismatch',
              message:
                'This Google account is already linked to a different role. Please continue with the existing account role.',
            }),
            302
          );
        }
        const switched = await switchUserRole(userRow.user_id, requestedRole);
        if (switched) userRow = switched;
      }
    }

    if (!userRow) {
      throw new AppError(500, 'Failed to resolve or create user for Google OAuth');
    }

    if (!userRow.is_active) {
      return c.redirect(
        buildRedirect(state.redirectUri, {
          error: 'account_inactive',
          message: 'This account is inactive. Please contact support.',
        }),
        302
      );
    }

    const tokenExpiresAt =
      typeof token.expiresIn === 'number' ? new Date(Date.now() + token.expiresIn * 1000) : null;

    await upsertGoogleAccount({
      userId: userRow.user_id,
      sub: idClaims.sub,
      email: idClaims.email,
      googleAccessToken: token.accessToken,
      googleRefreshToken: token.refreshToken,
      tokenExpiresAt,
      tokenType: token.tokenType,
      scope: token.scope,
      idToken: token.idToken,
    });

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
    const exchangeCode = jwt.sign(exchangePayload, env.JWT_SECRET, { expiresIn: '2m' });

    return c.redirect(
      buildRedirect(state.redirectUri, {
        code: exchangeCode,
      }),
      302
    );
  });

  /**
   * 3. Exchange short-lived code for real tokens (Secure POST)
   */
  app.post('/google/exchange', async (c) => {
    const { code } = await c.req.json().catch(() => ({}));

    if (!code) {
      return c.json({ success: false, error: 'missing_code' }, 400);
    }

    try {
      const payload = jwt.verify(code, env.JWT_SECRET) as any;

      const accessToken = generateAccessToken({
        userId: payload.userId,
        role: payload.role,
        onboardingStatus: payload.onboardingStatus,
        kycVerificationStatus: payload.kycVerificationStatus,
      });
      const refreshToken = generateRefreshToken(payload.userId);

      const frontendUser = toFrontendUser({
        user_id: payload.userId,
        role: payload.role,
        onboarding_status: payload.onboardingStatus,
        kyc_verification_status: payload.kycVerificationStatus,
        contact_email: payload.contactEmail,
        contact_phone: payload.contactPhone,
        is_active: payload.isActive,
        created_at: payload.createdAt,
      });

      return c.json({
        success: true,
        accessToken,
        refreshToken,
        user: frontendUser,
      });
    } catch (err: any) {
      return c.json(
        {
          success: false,
          error: 'invalid_code',
          message: err.message === 'jwt expired' ? 'Code expired. Please try again.' : 'Invalid exchange code.',
        },
        401
      );
    }
  });
}


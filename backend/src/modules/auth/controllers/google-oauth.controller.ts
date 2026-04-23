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
  nonce: string;
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

async function findUserForGoogle(sub: string, email?: string) {
  const byProviderUserId = await db.query(
    `SELECT u.user_id, u.role, u.onboarding_status, u.kyc_verification_status, u.contact_email, u.contact_phone, u.is_active, u.created_at
     FROM "OAuthAccount" oa
     JOIN "User" u ON u.user_id = oa.user_id
     WHERE oa.provider = 'GOOGLE' AND oa.provider_user_id = $1
     LIMIT 1`,
    [sub]
  );
  if (byProviderUserId.rows[0]) return byProviderUserId.rows[0];

  if (!email) return null;

  const byEmail = await db.query(
    `SELECT u.user_id, u.role, u.onboarding_status, u.kyc_verification_status, u.contact_email, u.contact_phone, u.is_active, u.created_at
     FROM "User" u
     WHERE u.contact_email = $1
     LIMIT 1`,
    [email]
  );
  return byEmail.rows[0] || null;
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

async function createUserFromGoogle(args: { email: string }) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      `INSERT INTO "User" (user_id, role, onboarding_status, kyc_verification_status, contact_email, is_active)
       VALUES (gen_random_uuid()::text, 'TENANT', 'PROFILE_PENDING', 'PENDING', $1, true)
       RETURNING user_id, role, onboarding_status, kyc_verification_status, contact_email, contact_phone, is_active, created_at`,
      [args.email]
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
  app.get('/google', async (c) => {
    const { clientId } = getRequiredGoogleEnv();

    const redirectUri = c.req.query('redirect_uri')?.trim();
    const modeRaw = (c.req.query('mode') || 'login').toLowerCase();
    const mode: OAuthMode = modeRaw === 'signup' ? 'signup' : 'login';

    if (!redirectUri) {
      throw new AppError(400, 'Missing redirect_uri');
    }

    let parsedRedirect: URL;
    try {
      parsedRedirect = new URL(redirectUri);
    } catch {
      throw new AppError(400, 'Invalid redirect_uri');
    }

    const origin = new URL(c.req.url).origin;
    const callbackUrl = `${origin}/auth/google/callback`;

    const state: GoogleStatePayload = {
      redirectUri: parsedRedirect.toString(),
      mode,
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
    const origin = new URL(c.req.url).origin;
    const callbackUrl = `${origin}/auth/google/callback`;

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

    let userRow = await findUserForGoogle(idClaims.sub, idClaims.email);

    if (!userRow) {
      if (state.mode === 'login') {
        return c.redirect(
          buildRedirect(state.redirectUri, {
            error: 'no_account',
            message: 'No account found for this Google email. Please sign up first.',
          }),
          302
        );
      }

      userRow = await createUserFromGoogle({ email: idClaims.email });
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

    const accessToken = generateAccessToken({
      userId: userRow.user_id,
      role: userRow.role,
      onboardingStatus: userRow.onboarding_status,
      kycVerificationStatus: userRow.kyc_verification_status,
    });
    const refreshToken = generateRefreshToken(userRow.user_id);

    const frontendUser = toFrontendUser(userRow);
    return c.redirect(
      buildRedirect(state.redirectUri, {
        accessToken,
        refreshToken,
        user: encodeURIComponent(JSON.stringify(frontendUser)),
      }),
      302
    );
  });
}


/**
 * Google OAuth controller
 * Handles HTTP request/response for Google OAuth endpoints
 *
 * Routes:
 *   GET  /auth/google           - Initiate Google OAuth flow
 *   GET  /auth/google/callback  - Handle Google redirect callback
 *   POST /auth/google/exchange  - Exchange short-lived code for JWT tokens
 *
 * Note: The two GET endpoints use plain app.get() instead of app.openapi()
 * because they return redirects (302), not typed JSON responses. Hono's
 * OpenAPI layer enforces strict return types that conflict with c.redirect().
 */

import type { OpenAPIHono } from '@hono/zod-openapi';
import { AppError } from '@/middlewares/error-handler';
import {
  getRequiredGoogleEnv,
  getGoogleCallbackUrl,
  buildRedirect,
  createStateToken,
  verifyStateToken,
  exchangeCodeForTokens,
  verifyGoogleIdToken,
  findUserForGoogle,
  normalizeRequestedRole,
  canSwitchRoleForGoogleSignup,
  switchUserRole,
  upsertGoogleAccount,
  createUserFromGoogle,
  createExchangeCode,
  verifyExchangeCode,
  generateTokensForUser,
} from '../services';

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
  // GET /auth/google — Initiate OAuth flow
  // Uses plain app.get() because c.redirect() is incompatible with OpenAPI typed responses
  app.get('/google', async (c) => {
    const { clientId } = getRequiredGoogleEnv();

    const redirectUri = c.req.query('redirect_uri')?.trim();
    const modeRaw = (c.req.query('mode') || 'login').toLowerCase();
    const mode = modeRaw === 'signup' ? 'signup' : 'login';
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
    const stateToken = createStateToken(parsedRedirect.toString(), mode, role);

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

  // GET /auth/google/callback — Handle Google redirect
  // Uses plain app.get() because c.redirect() is incompatible with OpenAPI typed responses
  app.get('/google/callback', async (c) => {
    const { clientId, clientSecret } = getRequiredGoogleEnv();

    const code = c.req.query('code');
    const stateToken = c.req.query('state');
    const googleError = c.req.query('error');

    // Handle errors from Google
    if (googleError) {
      try {
        if (stateToken) {
          const decoded = verifyStateToken(stateToken);
          return c.redirect(
            buildRedirect(decoded.redirectUri, {
              error: 'google_oauth_error',
              message: googleError,
            }),
            302
          );
        }
      } catch {
        // ignore invalid state
      }
      return c.json({ success: false, error: googleError }, 401);
    }

    if (!code || !stateToken) {
      throw new AppError(400, 'Missing code or state');
    }

    const state = verifyStateToken(stateToken);
    const callbackUrl = getGoogleCallbackUrl(c.req.url);

    // Exchange authorization code for tokens
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

    // Verify ID token and extract claims
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

    // Resolve or create user
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

    // Save/update Google OAuth account
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

    // Create short-lived exchange code and redirect to frontend
    const exchangeCode = createExchangeCode(userRow);

    return c.redirect(
      buildRedirect(state.redirectUri, { code: exchangeCode }),
      302
    );
  });

  // POST /auth/google/exchange — Exchange code for JWT tokens
  app.post('/google/exchange', async (c) => {
    const { code } = await c.req.json().catch(() => ({}));

    if (!code) {
      return c.json({ success: false, error: 'missing_code' }, 400);
    }

    try {
      const payload = verifyExchangeCode(code);
      const result = generateTokensForUser(payload);

      return c.json({
        success: true,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
    } catch (err: any) {
      return c.json(
        {
          success: false,
          error: 'invalid_code',
          message:
            err.message === 'jwt expired'
              ? 'Code expired. Please try again.'
              : 'Invalid exchange code.',
        },
        401
      );
    }
  });
}

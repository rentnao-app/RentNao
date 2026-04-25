/**
 * Verification controller
 * Handles email and phone verification endpoints
 */

import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  verifyEmail,
  verifyPhone,
  resendVerification,
  startPhoneVerification,
} from '../services';
import {
  verifyEmailRoute,
  verifyPhoneRoute,
  resendVerificationRoute,
  startPhoneVerificationRoute,
} from '../routes';
import { requireAuth } from '@/security';

/**
 * Register verification routes
 */
export function registerVerificationRoutes(app: OpenAPIHono) {
  // POST /auth/verify-email
  app.openapi(verifyEmailRoute, async (c) => {
    const { token } = c.req.valid('json');
    const result = await verifyEmail(token);

    return c.json(
      {
        success: true,
        data: { verified: true },
        message: result.message,
      },
      200
    );
  });

  // POST /auth/verify-phone
  app.openapi(verifyPhoneRoute, async (c) => {
    const { token } = c.req.valid('json');
    const result = await verifyPhone(token);

    return c.json(
      {
        success: true,
        data: { verified: true },
        message: result.message,
      },
      200
    );
  });

  // POST /auth/resend-verification
  app.openapi(resendVerificationRoute, async (c) => {
    const { identifier, type } = c.req.valid('json');
    const result = await resendVerification(identifier, type);

    return c.json(
      {
        success: true,
        data: { sent: true },
        message: result.message,
      },
      200
    );
  });

  // POST /auth/phone/start
  app.use('/phone/start', requireAuth);
  app.openapi(startPhoneVerificationRoute, async (c) => {
    const user = c.get('user');
    const { phone } = c.req.valid('json');
    const result = await startPhoneVerification(user.userId, phone);

    return c.json(
      {
        success: true,
        data: {
          sent: true,
          phone: result.phone,
        },
        message: result.message,
      },
      200
    );
  });
}

/**
 * Verification controller
 * Handles email and phone verification endpoints
 */

import type { OpenAPIHono } from '@hono/zod-openapi';
import { verifyEmail, verifyPhone, resendVerification } from '../services';
import {
  verifyEmailRoute,
  verifyPhoneRoute,
  resendVerificationRoute,
} from '../routes';

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
}

/**
 * Password reset controller
 * Handles password reset flow endpoints
 */

import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  requestPasswordReset,
  verifyPasswordResetToken,
  confirmPasswordReset,
} from '../services';
import {
  passwordResetRequestRoute,
  passwordResetVerifyRoute,
  passwordResetConfirmRoute,
} from '../routes';

/**
 * Register password reset routes
 */
export function registerPasswordRoutes(app: OpenAPIHono) {
  // POST /auth/password-reset/request
  app.openapi(passwordResetRequestRoute, async (c) => {
    const { identifier, type } = c.req.valid('json');
    const result = await requestPasswordReset(identifier, type);

    return c.json(
      {
        success: true,
        data: { sent: true },
        message: result.message,
      },
      200
    );
  });

  // POST /auth/password-reset/verify
  app.openapi(passwordResetVerifyRoute, async (c) => {
    const { token } = c.req.valid('json');
    const result = await verifyPasswordResetToken(token);

    return c.json(
      {
        success: true,
        data: { valid: true },
        message: result.message,
      },
      200
    );
  });

  // POST /auth/password-reset/confirm
  app.openapi(passwordResetConfirmRoute, async (c) => {
    const { token, newPassword } = c.req.valid('json');
    const result = await confirmPasswordReset(token, newPassword);

    return c.json(
      {
        success: true,
        data: { reset: true },
        message: result.message,
      },
      200
    );
  });
}

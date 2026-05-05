/**
 * Verification controller
 * Handles email and phone verification endpoints
 */

import type { OpenAPIHono } from '@hono/zod-openapi';
import {
  changePhoneVerification,
  getPendingPhoneVerificationStatus,
  resendPendingPhoneVerification,
  verifyEmail,
  verifyPhone,
  resendVerification,
  startPhoneVerification,
} from '../services';
import {
  changePhoneVerificationRoute,
  pendingPhoneVerificationRoute,
  resendPhoneVerificationRoute,
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
          sent: !result.alreadySent,
          phone: result.phone,
          alreadySent: result.alreadySent,
          otpTtlSeconds: result.otpTtlSeconds,
          rateResetSeconds: result.rateResetSeconds,
        },
        message: result.message,
      },
      200
    );
  });

  // POST /auth/phone/change
  app.use('/phone/change', requireAuth);
  app.openapi(changePhoneVerificationRoute, async (c) => {
    const user = c.get('user');
    const { phone } = c.req.valid('json');
    const result = await changePhoneVerification(user.userId, phone);

    return c.json(
      {
        success: true,
        data: {
          sent: !result.alreadySent,
          phone: result.phone,
          alreadySent: result.alreadySent,
          otpTtlSeconds: result.otpTtlSeconds,
          rateResetSeconds: result.rateResetSeconds,
        },
        message: result.message,
      },
      200
    );
  });

  // GET /auth/phone/pending
  app.use('/phone/pending', requireAuth);
  app.openapi(pendingPhoneVerificationRoute, async (c) => {
    const user = c.get('user');
    const pending = await getPendingPhoneVerificationStatus(user.userId);

    return c.json(
      {
        success: true,
        data: {
          exists: pending.exists,
          phone: pending.phone || null,
          otpTtlSeconds: pending.otpTtlSeconds,
          rateResetSeconds: pending.rateResetSeconds,
        },
        message: pending.exists ? 'Pending phone verification found' : 'No pending phone verification',
      },
      200
    );
  });

  // POST /auth/phone/resend
  app.use('/phone/resend', requireAuth);
  app.openapi(resendPhoneVerificationRoute, async (c) => {
    const user = c.get('user');
    const result = await resendPendingPhoneVerification(user.userId);

    return c.json(
      {
        success: true,
        data: {
          sent: !result.alreadySent,
          phone: result.phone,
          alreadySent: result.alreadySent,
          otpTtlSeconds: result.otpTtlSeconds,
          rateResetSeconds: result.rateResetSeconds,
        },
        message: result.message,
      },
      200
    );
  });
}

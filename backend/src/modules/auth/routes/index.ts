/**
 * Authentication Routes Index
 * Barrel export for all authentication route definitions
 * 
 * ═══════════════════════════════════════════════════════════════════
 * AUTHENTICATION ROUTES OVERVIEW
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Auth Routes (auth.routes.ts):
 *   POST   /auth/register                - Register new user account
 *   POST   /auth/login                   - Login with credentials
 * 
 * Verification Routes (verification.routes.ts):
 *   POST   /auth/verify-email            - Verify email address
 *   POST   /auth/verify-phone            - Verify phone number
 *   POST   /auth/resend-verification     - Resend verification token
 *   POST   /auth/phone/start             - Start phone verification (auth)
 *   POST   /auth/phone/change            - Change phone during verification (auth)
 *   POST   /auth/phone/resend            - Resend OTP for pending phone (auth)
 *   GET    /auth/phone/pending           - Get pending phone verification (auth)
 * 
 * Password Reset Routes (password.routes.ts):
 *   POST   /auth/password-reset/request  - Request password reset
 *   POST   /auth/password-reset/verify   - Verify reset token
 *   POST   /auth/password-reset/confirm  - Confirm password reset
 * 
 * ═══════════════════════════════════════════════════════════════════
 */

// Auth routes
export { registerRoute, loginRoute, logoutRoute } from './auth.routes';

// Verification routes
export {
  changePhoneVerificationRoute,
  pendingPhoneVerificationRoute,
  resendPhoneVerificationRoute,
  verifyEmailRoute,
  verifyPhoneRoute,
  resendVerificationRoute,
  startPhoneVerificationRoute,
} from './verification.routes';

// Password reset routes
export {
  passwordResetRequestRoute,
  passwordResetVerifyRoute,
  passwordResetConfirmRoute,
} from './password.routes';

// Helpers (re-export for external use if needed)
export { commonErrors } from './helpers';

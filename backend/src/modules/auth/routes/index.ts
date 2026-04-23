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
  verifyEmailRoute,
  verifyPhoneRoute,
  resendVerificationRoute,
} from './verification.routes';

// Password reset routes
export {
  passwordResetRequestRoute,
  passwordResetVerifyRoute,
  passwordResetConfirmRoute,
} from './password.routes';

// Helpers (re-export for external use if needed)
export { commonErrors } from './helpers';

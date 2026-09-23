/**
 * Barrel export for auth services
 * Central export point for all authentication service functions
 */

// Auth services (registration & login)
export { registerUser, loginUser, logoutUser } from './auth.service';

// Verification services (email/phone verification)
export {
  bootstrapPhoneVerification,
  changePhoneVerification,
  getPendingPhoneVerificationStatus,
  resendPendingPhoneVerification,
  verifyEmail,
  verifyPhone,
  resendVerification,
  startPhoneVerification,
} from './verification.service';

// Password services (password reset flow)
export {
  requestPasswordReset,
  verifyPasswordResetToken,
  confirmPasswordReset,
} from './password.service';

// Token storage services (Redis operations)
export {
  storeVerificationToken,
  verifyToken,
  deleteVerificationToken,
  hasVerificationToken,
  getVerificationTokenTTL,
} from './token-storage.service';

// Google OAuth services
export {
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
  toFrontendUser,
  createExchangeCode,
  verifyExchangeCode,
  generateTokensForUser,
} from './google-oauth.service';

// Re-export types for convenience
export type { AuthTokens, UserWithTokens } from '../types/auth.types';

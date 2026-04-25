/**
 * Barrel export for auth schemas
 * Central export point for all authentication schemas and types
 */

// Common/shared schemas
export {
  userSchema,
  tokensSchema,
  errorResponseSchema,
} from './common.schemas';

// Auth schemas (register & login)
export {
  registerSchema,
  registerResponseSchema,
  loginSchema,
  loginResponseSchema,
  logoutResponseSchema,
  type RegisterInput,
  type LoginInput,
} from './auth.schemas';

// Verification schemas
export {
  verifyEmailSchema,
  verifyPhoneSchema,
  resendVerificationSchema,
  startPhoneVerificationSchema,
  verificationResponseSchema,
  resendVerificationResponseSchema,
  startPhoneVerificationResponseSchema,
  type VerifyEmailInput,
  type VerifyPhoneInput,
  type ResendVerificationInput,
  type StartPhoneVerificationInput,
} from './verification.schemas';

// Password reset schemas
export {
  passwordResetRequestSchema,
  passwordResetRequestResponseSchema,
  passwordResetVerifySchema,
  passwordResetVerifyResponseSchema,
  passwordResetConfirmSchema,
  passwordResetConfirmResponseSchema,
  type PasswordResetRequestInput,
  type PasswordResetVerifyInput,
  type PasswordResetConfirmInput,
} from './password.schemas';

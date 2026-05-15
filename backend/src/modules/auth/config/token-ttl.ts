/**
 * Token TTL (Time To Live) configuration
 * Centralized configuration for all token expiration times
 */

/**
 * Token TTL values in seconds
 */
export const TOKEN_TTL = {
  /**
   * Email verification token TTL
   * Default: 24 hours (86400 seconds)
   */
  EMAIL_VERIFICATION: 86400,

  /**
   * Phone verification token (OTP) TTL
   * Default: 15 minutes (900 seconds)
   * Shorter duration for OTP security
   */
  PHONE_VERIFICATION: 300,

  /**
   * Password reset token TTL
   * Default: 1 hour (3600 seconds)
   */
  PASSWORD_RESET: 300,

  /**
   * Magic link token TTL
   * Default: 10 minutes (600 seconds)
   */
  MAGIC_LINK: 600,
} as const;

/**
 * Helper to get TTL in hours for display/logging
 */
export function getTTLInHours(seconds: number): number {
  return seconds / 3600;
}

/**
 * Helper to get TTL in minutes for display/logging
 */
export function getTTLInMinutes(seconds: number): number {
  return seconds / 60;
}

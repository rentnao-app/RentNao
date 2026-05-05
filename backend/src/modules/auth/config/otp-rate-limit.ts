/**
 * OTP rate limiting configuration
 * Controls how often a user can request OTPs
 */

export const OTP_RATE_LIMIT = {
  WINDOW_SECONDS: 300,
  MAX_REQUESTS: 3,
} as const;

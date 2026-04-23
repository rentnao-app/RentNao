/**
 * Token generation and hashing utilities
 * Handles secure token generation and hashing for authentication flows
 */

import crypto from 'crypto';

/**
 * Generate a cryptographically secure random token for email/phone verification
 * Returns a URL-safe base64 string (32 bytes = ~43 chars)
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate a secure 6-digit OTP for SMS verification
 * Uses cryptographically secure random number generation
 */
export function generateOTP(): string {
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0);
  const otp = (num % 900000) + 100000; // Range: 100000-999999
  return otp.toString();
}

/**
 * Hash a token using SHA-256
 * Used to store tokens securely in Redis without exposing plaintext
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

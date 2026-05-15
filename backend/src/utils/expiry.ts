/**
 * Date expiry utilities
 * Used for conversation 30-day TTL and future time-bounded features
 */

/**
 * Compute an expiry date from a given start date
 * @param fromDate - The starting date
 * @param days - Number of days until expiry
 */
export function computeExpiresAt(fromDate: Date, days: number): Date {
  return new Date(fromDate.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Check if a given expiry timestamp has passed
 * Returns false if expiresAt is null (no expiry set = never expires)
 */
export function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
}

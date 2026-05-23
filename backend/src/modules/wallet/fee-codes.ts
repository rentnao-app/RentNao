/**
 * Canonical fee codes used in API / frontend, with DB alias fallbacks.
 * Production admin setups may use alternate codes (e.g. OWNER_FEE).
 */
export const FEE_POLICY_ALIASES = {
  LISTING_CREATE: ['LISTING_CREATE', 'OWNER_FEE', 'OWNER_LISTING_FEE', 'LISTING_FEE'],
  LISTING_UNLOCK: ['LISTING_UNLOCK', 'TENANT_FEE', 'TENANT_LISTING_FEE', 'LISTING_UNLOCK_FEE'],
} as const;

export type CanonicalFeeCode = keyof typeof FEE_POLICY_ALIASES;

export function resolveFeePolicyCodes(feeCode: string): string[] {
  const aliases = FEE_POLICY_ALIASES[feeCode as CanonicalFeeCode];
  if (aliases) return [...aliases];
  return [feeCode];
}

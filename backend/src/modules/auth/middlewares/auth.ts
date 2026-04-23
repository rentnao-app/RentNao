/**
 * Backward-compatible re-export of shared security middleware.
 * New imports should prefer '@/security'.
 */

export {
  requireAuth,
  optionalAuth,
  requireRole,
  requireCompletedOnboarding,
  requireKycApproved,
} from '@/security';

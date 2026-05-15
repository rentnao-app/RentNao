/**
 * KYC Verification middleware
 * Gates access to restricted actions based on KYC verification status
 */

import { db } from '@/db/client';
import { error } from '@/utils/response';
import type { Context, Next } from 'hono';

/**
 * Require KYC approval + profile completion
 * Used for restricted actions: apply, list property, accept/reject, pay
 * Blocks access until user has COMPLETED onboarding AND APPROVED KYC
 */
export async function requireKycApproved(c: Context, next: Next) {
  try {
    const user = c.get('user');
    if (!user) {
      return error(c, 'Authentication required', 401);
    }

    const userResult = await db.query(
      `SELECT onboarding_status, kyc_verification_status FROM "User" WHERE user_id = $1`,
      [user.userId]
    );

    if (userResult.rows.length === 0) {
      return error(c, 'User not found', 404);
    }

    const { onboarding_status, kyc_verification_status } = userResult.rows[0];

    // Check onboarding completion
    if (onboarding_status !== 'COMPLETED') {
      return error(
        c,
        'Profile completion and KYC verification required to access this feature. Please complete your profile and submit documents for verification.',
        403
      );
    }

    // Check KYC approval
    if (kyc_verification_status !== 'APPROVED') {
      return error(
        c,
        'KYC verification required. Please submit your documents for review.',
        403
      );
    }

    await next();
  } catch (err: any) {
    console.error('KYC approval middleware error:', err);
    return error(c, 'Failed to verify KYC status', 500);
  }
}

/**
 * Require profile completion (allow pre-approval access)
 * Allows: browse, edit profile
 * Blocks: None at this level (restrictive actions use requireKycApproved)
 */
export async function requireProfileComplete(c: Context, next: Next) {
  try {
    const user = c.get('user');
    if (!user) {
      return error(c, 'Authentication required', 401);
    }

    const userResult = await db.query(
      `SELECT onboarding_status FROM "User" WHERE user_id = $1`,
      [user.userId]
    );

    if (userResult.rows.length === 0) {
      return error(c, 'User not found', 404);
    }

    const { onboarding_status } = userResult.rows[0];

    // Allow post-registration but pre-profile
    if (
      onboarding_status === 'PHONE_REQUIRED' ||
      onboarding_status === 'PHONE_VERIFICATION_PENDING'
    ) {
      return error(c, 'Profile completion required', 403);
    }

    await next();
  } catch (err: any) {
    console.error('Profile complete middleware error:', err);
    return error(c, 'Failed to verify profile status', 500);
  }
}

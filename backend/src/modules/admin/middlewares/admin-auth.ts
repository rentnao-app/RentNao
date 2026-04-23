/**
 * Admin authorization middleware
 * Ensures only ADMIN role can access admin routes
 */

import { requireAuth, requireRole } from '@/security';

/**
 * Composite middleware for admin routes
 * Checks authentication + ADMIN role
 */
export const requireAdmin = [requireAuth, requireRole('ADMIN')];

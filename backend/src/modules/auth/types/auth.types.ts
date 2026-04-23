/**
 * Shared type definitions for auth module
 * Types are derived from Zod schemas for consistency
 */

import { z } from 'zod';
import { tokensSchema, userSchema } from '../schemas';

// ============================================================================
// Derive types from Zod schemas
// ============================================================================

/**
 * Auth tokens structure (derived from Zod schema)
 */
export type AuthTokens = z.infer<typeof tokensSchema>;

/**
 * User data for internal service use
 * Note: createdAt is Date object (not ISO string like in API response)
 */
export type UserData = Omit<z.infer<typeof userSchema>, 'createdAt'> & {
  createdAt: Date;
};

/**
 * Complete user response with tokens
 * Used by service layer for register/login operations
 */
export interface UserWithTokens {
  user: UserData;
  tokens: AuthTokens;
  needsVerification: boolean;
}

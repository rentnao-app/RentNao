/**
 * Authentication controllers (The Bridge)
 * Implements routes and maps HTTP to service layer
 * 
 * Note: This file now re-exports from the modularized controllers directory.
 * Actual controller logic is split into:
 *   - controllers/auth.controller.ts
 *   - controllers/verification.controller.ts
 *   - controllers/password.controller.ts
 */

export { default } from '../controllers';

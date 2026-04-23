/**
 * Authentication Controllers Index
 * Creates Hono app and registers all auth route handlers
 * 
 * Controller Organization:
 *   - auth.controller.ts         - Registration & login handlers
 *   - verification.controller.ts - Email/phone verification handlers
 *   - password.controller.ts     - Password reset handlers
 */

import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { registerAuthRoutes } from './auth.controller';
import { registerVerificationRoutes } from './verification.controller';
import { registerPasswordRoutes } from './password.controller';
import { registerGoogleOAuthRoutes } from './google-oauth.controller';

/**
 * Create and configure auth application
 */
const auth = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

// Register all route handlers
registerAuthRoutes(auth);
registerVerificationRoutes(auth);
registerPasswordRoutes(auth);
registerGoogleOAuthRoutes(auth);

export default auth;

/**
 * Authentication controller
 * Handles registration and login endpoints
 */

import type { OpenAPIHono } from '@hono/zod-openapi';
import { registerUser, loginUser, logoutUser } from '../services';
import { registerRoute, loginRoute, logoutRoute } from '../routes';
import { requireAuth } from '@/security';

/**
 * Register authentication routes
 */
export function registerAuthRoutes(app: OpenAPIHono) {
  // POST /auth/register
  app.openapi(registerRoute, async (c) => {
    const body = c.req.valid('json');
    const result = await registerUser(body);

    return c.json(
      {
        success: true,
        data: {
          user: {
            ...result.user,
            createdAt: result.user.createdAt.toISOString(),
          },
          tokens: result.tokens,
          needsVerification: result.needsVerification,
        },
        message: `Registration successful. Please verify your ${body.identifierType.toLowerCase()} to continue.`,
      },
      201
    );
  });

  // POST /auth/login
  app.openapi(loginRoute, async (c) => {
    const body = c.req.valid('json');
    const result = await loginUser(body);

    return c.json(
      {
        success: true,
        data: {
          user: {
            ...result.user,
            createdAt: result.user.createdAt.toISOString(),
          },
          tokens: result.tokens,
        },
        message: 'Login successful. Welcome back!',
      },
      200
    );
  });

  // POST /auth/logout
  app.use('/logout', requireAuth);
  app.openapi(logoutRoute, async (c) => {
    const token = c.get('authToken');
    await logoutUser(token);

    return c.json(
      {
        success: true,
        message: 'Logout successful',
      },
      200
    );
  });
}

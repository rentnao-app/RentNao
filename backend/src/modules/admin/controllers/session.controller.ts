import { OpenAPIHono } from '@hono/zod-openapi';
import * as adminRoutes from '../routes';
import * as adminService from '../services';

export function registerSessionRoutes(admin: OpenAPIHono) {
  admin.openapi(adminRoutes.getUserSessionsRoute, async (c) => {
    const { userId } = c.req.valid('param');

    const sessions = await adminService.getUserSessions(userId);

    return c.json({
      success: true,
      data: { sessions },
    }, 200);
  });

  admin.openapi(adminRoutes.invalidateUserSessionsRoute, async (c) => {
    const { userId } = c.req.valid('param');

    const result = await adminService.invalidateUserSessions(userId);

    return c.json({
      success: true,
      message: result.message,
    }, 200);
  });

  admin.openapi(adminRoutes.invalidateSessionRoute, async (c) => {
    const { sessionId } = c.req.valid('param');

    const result = await adminService.invalidateSession(sessionId);

    return c.json({
      success: true,
      message: result.message,
    }, 200);
  });
}

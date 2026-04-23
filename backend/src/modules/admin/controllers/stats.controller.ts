import { OpenAPIHono } from '@hono/zod-openapi';
import * as adminRoutes from '../routes';
import * as adminService from '../services';

export function registerStatsRoutes(admin: OpenAPIHono) {
  admin.openapi(adminRoutes.getStatsOverviewRoute, async (c) => {
    const stats = await adminService.getStatsOverview();

    return c.json({
      success: true,
      data: stats,
    }, 200);
  });
}

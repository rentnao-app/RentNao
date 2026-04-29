import type { OpenAPIHono } from '@hono/zod-openapi';
import { AppError } from '@/errors/base';
import {
  listTopupRequestsRoute,
  approveTopupRequestRoute,
  rejectTopupRequestRoute,
} from '../routes/topup.routes';
import * as walletServices from '../../wallet/services';

/**
 * Register admin topup routes
 */
export function registerAdminTopupRoutes(app: OpenAPIHono) {
  // GET /admin/topup-requests
  app.openapi(listTopupRequestsRoute, async (c) => {
    const user = c.get('user');

    // Verify admin access
    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'Admin access required');
    }

    const query = c.req.valid('query');
    const page = query.page || 1;
    const limit = query.limit || 20;
    const status = query.status || undefined;

    const result = await walletServices.getAdminTopupRequests(status, page, limit);
    return c.json({
      success: true,
      data: result,
    });
  });

  // POST /admin/topup-requests/{topupRequestId}/approve
  app.openapi(approveTopupRequestRoute, async (c) => {
    const user = c.get('user');

    // Verify admin access
    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'Admin access required');
    }

    const { topupRequestId } = c.req.valid('param');

    const result = await walletServices.approveTopupRequest(topupRequestId, user.userId);
    return c.json({
      success: true,
      data: result,
    });
  });

  // POST /admin/topup-requests/{topupRequestId}/reject
  app.openapi(rejectTopupRequestRoute, async (c) => {
    const user = c.get('user');

    // Verify admin access
    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'Admin access required');
    }

    const { topupRequestId } = c.req.valid('param');
    const body = c.req.valid('json');

    const result = await walletServices.rejectTopupRequest(topupRequestId, body.rejectionReason);
    return c.json({
      success: true,
      data: result,
    });
  });
}

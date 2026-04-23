import { OpenAPIHono } from '@hono/zod-openapi';
import * as adminRoutes from '../routes';
import * as adminService from '../services';

export function registerFeePolicyRoutes(admin: OpenAPIHono) {
  admin.openapi(adminRoutes.listFeePoliciesRoute, async (c) => {
    const query = c.req.valid('query');
    const result = await adminService.listFeePolicies(query);

    return c.json({
      success: true,
      data: {
        feePolicies: result.feePolicies,
        pagination: result.pagination,
      },
    }, 200);
  });

  admin.openapi(adminRoutes.getFeePolicyByIdRoute, async (c) => {
    const { feePolicyId } = c.req.valid('param');
    const feePolicy = await adminService.getFeePolicyById(feePolicyId);

    return c.json({
      success: true,
      data: { feePolicy },
    }, 200);
  });

  admin.openapi(adminRoutes.createFeePolicyRoute, async (c) => {
    const body = c.req.valid('json');
    const { userId } = c.get('user');
    const feePolicy = await adminService.createFeePolicy(body, userId);

    return c.json({
      success: true,
      data: { feePolicy },
      message: 'Fee policy created successfully',
    }, 201);
  });

  admin.openapi(adminRoutes.updateFeePolicyRoute, async (c) => {
    const { feePolicyId } = c.req.valid('param');
    const body = c.req.valid('json');
    const feePolicy = await adminService.updateFeePolicy(feePolicyId, body);

    return c.json({
      success: true,
      data: { feePolicy },
      message: 'Fee policy updated successfully',
    }, 200);
  });

  admin.openapi(adminRoutes.activateFeePolicyRoute, async (c) => {
    const { feePolicyId } = c.req.valid('param');
    const feePolicy = await adminService.activateFeePolicy(feePolicyId);

    return c.json({
      success: true,
      data: { feePolicy },
      message: 'Fee policy activated successfully',
    }, 200);
  });

  admin.openapi(adminRoutes.deactivateFeePolicyRoute, async (c) => {
    const { feePolicyId } = c.req.valid('param');
    const feePolicy = await adminService.deactivateFeePolicy(feePolicyId);

    return c.json({
      success: true,
      data: { feePolicy },
      message: 'Fee policy deactivated successfully',
    }, 200);
  });
}

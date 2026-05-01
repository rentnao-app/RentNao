import { OpenAPIHono } from '@hono/zod-openapi';
import * as adminRoutes from '../routes';
import * as adminService from '../services';

export function registerDiscountPolicyRoutes(admin: OpenAPIHono) {
  admin.openapi(adminRoutes.listDiscountPoliciesRoute, async (c) => {
    const query = c.req.valid('query');
    const result = await adminService.listDiscountPolicies(query);

    return c.json({
      success: true,
      data: {
        discountPolicies: result.discountPolicies,
        pagination: result.pagination,
      },
    }, 200);
  });

  admin.openapi(adminRoutes.getDiscountPolicyByIdRoute, async (c) => {
    const { discountPolicyId } = c.req.valid('param');
    const discountPolicy = await adminService.getDiscountPolicyById(discountPolicyId);

    return c.json({
      success: true,
      data: { discountPolicy },
    }, 200);
  });

  admin.openapi(adminRoutes.createDiscountPolicyRoute, async (c) => {
    const body = c.req.valid('json');
    const discountPolicy = await adminService.createDiscountPolicy(body);

    return c.json({
      success: true,
      data: { discountPolicy },
      message: 'Discount policy created successfully',
    }, 201);
  });

  admin.openapi(adminRoutes.updateDiscountPolicyRoute, async (c) => {
    const { discountPolicyId } = c.req.valid('param');
    const body = c.req.valid('json');
    const discountPolicy = await adminService.updateDiscountPolicy(discountPolicyId, body);

    return c.json({
      success: true,
      data: { discountPolicy },
      message: 'Discount policy updated successfully',
    }, 200);
  });

  admin.openapi(adminRoutes.activateDiscountPolicyRoute, async (c) => {
    const { discountPolicyId } = c.req.valid('param');
    const discountPolicy = await adminService.activateDiscountPolicy(discountPolicyId);

    return c.json({
      success: true,
      data: { discountPolicy },
      message: 'Discount policy activated successfully',
    }, 200);
  });

  admin.openapi(adminRoutes.deactivateDiscountPolicyRoute, async (c) => {
    const { discountPolicyId } = c.req.valid('param');
    const discountPolicy = await adminService.deactivateDiscountPolicy(discountPolicyId);

    return c.json({
      success: true,
      data: { discountPolicy },
      message: 'Discount policy deactivated successfully',
    }, 200);
  });

  admin.openapi(adminRoutes.listDiscountEligibleUsersRoute, async (c) => {
    const { discountPolicyId } = c.req.valid('param');
    const query = c.req.valid('query');
    const page = query.page || 1;
    const limit = query.limit || 10;

    const result = await adminService.listDiscountEligibleUsers(discountPolicyId, page, limit);
    return c.json({
      success: true,
      data: result,
    }, 200);
  });

  admin.openapi(adminRoutes.addDiscountEligibleUsersRoute, async (c) => {
    const { discountPolicyId } = c.req.valid('param');
    const body = c.req.valid('json');

    const result = await adminService.addDiscountEligibleUsers(discountPolicyId, body.userIds);
    return c.json({
      success: true,
      data: result,
      message: 'Eligible users added successfully',
    }, 200);
  });

  admin.openapi(adminRoutes.removeDiscountEligibleUsersRoute, async (c) => {
    const { discountPolicyId } = c.req.valid('param');
    const body = c.req.valid('json');

    const result = await adminService.removeDiscountEligibleUsers(discountPolicyId, body.userIds);
    return c.json({
      success: true,
      data: result,
      message: 'Eligible users removed successfully',
    }, 200);
  });
}

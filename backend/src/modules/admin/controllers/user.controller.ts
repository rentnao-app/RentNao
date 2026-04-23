import { OpenAPIHono } from '@hono/zod-openapi';
import * as adminRoutes from '../routes';
import * as adminService from '../services';
import { AppError } from '@/errors/base';

export function registerUserManagementRoutes(admin: OpenAPIHono) {
  admin.openapi(adminRoutes.listUsersRoute, async (c) => {
    const query = c.req.valid('query');
    const { userId } = c.get('user');

    const result = await adminService.listUsers(query, userId);

    return c.json({
      success: true,
      data: {
        users: result.users,
        pagination: result.pagination,
      },
    }, 200);
  });

  admin.openapi(adminRoutes.getUserByIdRoute, async (c) => {
    const { userId } = c.req.valid('param');

    const result = await adminService.getUserById(userId);

    return c.json({
      success: true,
      data: result,
    }, 200);
  });

  admin.openapi(adminRoutes.updateOnboardingStatusRoute, async (c) => {
    const { userId } = c.req.valid('param');
    const body = c.req.valid('json');

    const user = await adminService.updateUserOnboardingStatus(userId, body);

    return c.json({
      success: true,
      data: { user },
      message: 'Onboarding status updated successfully',
    }, 200);
  });

  admin.openapi(adminRoutes.updateRoleRoute, async (c) => {
    const { userId } = c.req.valid('param');
    const body = c.req.valid('json');
    const { userId: currentUserId } = c.get('user');

    const user = await adminService.updateUserRole(userId, body, currentUserId);

    return c.json({
      success: true,
      data: { user },
      message: 'User role updated successfully',
    }, 200);
  });

  admin.openapi(adminRoutes.updateActiveStatusRoute, async (c) => {
    const { userId } = c.req.valid('param');
    const body = c.req.valid('json');
    const { userId: currentUserId } = c.get('user');

    const user = await adminService.updateUserActiveStatus(userId, body, currentUserId);

    return c.json({
      success: true,
      data: { user },
      message: 'User active status updated successfully',
    }, 200);
  });

  admin.openapi(adminRoutes.softDeleteUserRoute, async (c) => {
    const { userId } = c.req.valid('param');
    const { userId: currentUserId } = c.get('user');

    const result = await adminService.softDeleteUser(userId, currentUserId);

    return c.json({
      success: true,
      message: result.message,
    }, 200);
  });

  admin.openapi(adminRoutes.restoreUserRoute, async (c) => {
    const { userId } = c.req.valid('param');

    const user = await adminService.restoreUser(userId);

    return c.json({
      success: true,
      data: { user },
      message: 'User restored successfully',
    }, 200);
  });

  admin.openapi(adminRoutes.forceKycStatusRoute, async (c) => {
    const { userId } = c.req.valid('param');
    const body = c.req.valid('json');
    const adminId = c.get('user').userId;

    if (userId === adminId) {
      throw new AppError(400, 'Cannot modify your own KYC status');
    }

    const result = await adminService.forceKycStatus(userId, body.kycVerificationStatus, body.reason);

    return c.json({
      success: true,
      data: result,
      message: `KYC status set to ${body.kycVerificationStatus}`,
    }, 200);
  });
}

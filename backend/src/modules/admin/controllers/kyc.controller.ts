import { OpenAPIHono } from '@hono/zod-openapi';
import * as adminRoutes from '../routes';
import * as adminService from '../services';

export function registerKycRoutes(admin: OpenAPIHono) {
  admin.openapi(adminRoutes.listKycSubmissionsRoute, async (c) => {
    const query = c.req.valid('query');
    const { userId } = c.get('user');

    const result = await adminService.listKycSubmissions(query, userId);

    return c.json({
      success: true,
      data: {
        submissions: result.submissions,
        pagination: result.pagination,
      },
    }, 200);
  });

  admin.openapi(adminRoutes.getKycSubmissionDetailRoute, async (c) => {
    const { submissionId } = c.req.valid('param');

    const result = await adminService.getKycSubmissionDetail(submissionId);

    return c.json({
      success: true,
      data: result,
    }, 200);
  });

  admin.openapi(adminRoutes.reviewKycSubmissionRoute, async (c) => {
    const { submissionId } = c.req.valid('param');
    const body = c.req.valid('json');
    const { userId } = c.get('user');

    const result = await adminService.reviewKycSubmission(
      submissionId,
      body.decision,
      body.rejectionReason,
      userId
    );

    return c.json({
      success: true,
      data: {
        submissionId: result.submissionId,
        userId: result.userId,
        status: body.decision,
        reviewedAt:
          result.reviewedAt instanceof Date
            ? result.reviewedAt.toISOString()
            : new Date(result.reviewedAt).toISOString(),
        userKycStatus: result.userKycStatus,
        userOnboardingStatus: result.userOnboardingStatus,
      },
      message: `KYC submission ${body.decision.toLowerCase()} successfully`,
    }, 200);
  });
}

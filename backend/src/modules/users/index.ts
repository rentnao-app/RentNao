import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { db } from '@/db/client';
import { AppError } from '@/errors/base';
import * as routes from './routes';
import * as schemas from './schemas';
import * as profileService from './services/profile.service';
import * as verificationService from './services/verification.service';
import { requireAuth } from '@/security';

const users = new OpenAPIHono<{
  Variables: {
    user: any;
    authToken: string;
  };
}>({
  defaultHook: defaultValidationHook,
});

// Apply auth middleware to all routes
users.use('*', requireAuth);

/**
 * GET /users/{userId}/profile-status
 * Get profile completion & KYC verification status
 */
users.openapi(routes.getProfileStatusRoute, async (c) => {
  const { userId } = c.req.valid('param');
  const authUser = c.get('user');

  if (authUser.userId !== userId && authUser.role !== 'ADMIN') {
    throw new AppError(403, 'You can only access your own profile status');
  }

  const userResult = await db.query(
    `SELECT u.user_id, u.role, u.onboarding_status, u.kyc_verification_status, u.contact_email, u.contact_phone
     FROM "User" u WHERE u.user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const user = userResult.rows[0];
  const completionStatus = await profileService.getProfileCompletionStatus(userId, user.role);
  const profileDetails = await profileService.getProfileDetails(userId, user.role);
  const requiredDocs = profileService.getRequiredDocuments(user.role);
  const uploadedDocs = await profileService.getUserDocuments(userId);
  const docStatus = requiredDocs.map((req) => {
    const uploaded = uploadedDocs.find((d) => d.document_type === req.documentType);
    return {
      documentType: req.documentType,
      description: req.description,
      uploadStatus: uploaded?.verification_status,
    };
  });

  return c.json(
    {
      success: true,
      data: {
        userId: user.user_id,
        role: user.role,
        onboardingStatus: user.onboarding_status,
        kycVerificationStatus: user.kyc_verification_status,
        contactEmail: user.contact_email,
        contactPhone: user.contact_phone,
        profileCompletion: completionStatus,
        profile: profileDetails,
        requiredDocuments: docStatus,
      },
    },
    200
  );
});

/**
 * POST /users/{userId}/profile
 * Create user profile (tenant or owner)
 */
users.openapi(routes.createProfileRoute, async (c) => {
  const { userId } = c.req.valid('param');
  const authUser = c.get('user');
  const body = c.req.valid('json');

  if (authUser.userId !== userId) {
    throw new AppError(403, 'You can only create your own profile');
  }

  const userResult = await db.query(
    `SELECT role FROM "User" WHERE user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const userRole = userResult.rows[0].role;
  if (userRole !== (body as any).role) {
    throw new AppError(400, 'Role mismatch');
  }

  await profileService.createOrUpdateProfile(userId, userRole, body as any);
  const completionStatus = await profileService.getProfileCompletionStatus(userId, userRole);

  return c.json(
    {
      success: true,
      data: {
        userId,
        role: userRole,
        profileCompletion: completionStatus,
        onboardingStatus: 'PROFILE_PENDING',
      },
      message: 'Profile created successfully. Next: submit required documents for verification.',
    },
    201
  );
});

/**
 * POST /users/{userId}/profile-photo/upload-url
 * Get presigned upload URL for profile photo
 */
users.openapi(routes.getProfilePhotoUploadUrlRoute, async (c) => {
  const { userId } = c.req.valid('param');
  const authUser = c.get('user');
  const body = c.req.valid('json');

  if (authUser.userId !== userId) {
    throw new AppError(403, 'You can only upload a profile photo for your own account');
  }

  const presigned = await profileService.getProfilePhotoUploadUrl(userId, body);

  return c.json(
    {
      success: true,
      data: presigned,
    },
    200
  );
});

/**
 * PATCH /users/{userId}/profile
 * Update user profile
 */
users.openapi(routes.updateProfileRoute, async (c) => {
  const { userId } = c.req.valid('param');
  const authUser = c.get('user');
  const body = c.req.valid('json');

  if (authUser.userId !== userId) {
    throw new AppError(403, 'You can only update your own profile');
  }

  const userResult = await db.query(
    `SELECT role FROM "User" WHERE user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const userRole = userResult.rows[0].role;
  if (userRole !== 'TENANT' && userRole !== 'OWNER') {
    throw new AppError(400, 'Profile updates are only available for TENANT and OWNER accounts');
  }

  // Re-validate against the authenticated user's actual role to avoid enum/type
  // mismatches reaching SQL and surfacing as generic DB format errors.
  const roleValidatedBody =
    userRole === 'TENANT'
      ? schemas.updateTenantProfileSchema.parse(body)
      : schemas.updateOwnerProfileSchema.parse(body);

  await profileService.createOrUpdateProfile(userId, userRole, roleValidatedBody as any);
  const completionStatus = await profileService.getProfileCompletionStatus(userId, userRole);

  return c.json(
    {
      success: true,
      data: {
        userId,
        profileCompletion: completionStatus,
      },
      message: 'Profile updated successfully',
    },
    200
  );
});

/**
 * GET /users/{userId}/verification/required-documents
 * Get required documents for role
 */
users.openapi(routes.getRequiredDocumentsRoute, async (c) => {
  const { userId } = c.req.valid('param');
  const authUser = c.get('user');

  if (authUser.userId !== userId && authUser.role !== 'ADMIN') {
    throw new AppError(403, 'You can only access your own required documents');
  }

  const userResult = await db.query(
    `SELECT role FROM "User" WHERE user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const userRole = userResult.rows[0].role;
  const requiredDocs = profileService.getRequiredDocuments(userRole);

  return c.json(
    {
      success: true,
      data: {
        userId,
        role: userRole,
        requiredDocuments: requiredDocs,
      },
    },
    200
  );
});

/**
 * POST /users/{userId}/verification/upload-url
 * Get presigned upload URL
 */
users.openapi(routes.getUploadUrlRoute, async (c) => {
  const { userId } = c.req.valid('param');
  const authUser = c.get('user');
  const body = c.req.valid('json');

  if (authUser.userId !== userId) {
    throw new AppError(403, 'You can only upload documents for your own account');
  }

  const presigned = await verificationService.getDocumentUploadUrl(userId, body);

  return c.json(
    {
      success: true,
      data: presigned,
    },
    200
  );
});

/**
 * POST /users/{userId}/verification/submit
 * Submit verification documents
 */
users.openapi(routes.submitVerificationRoute, async (c) => {
  const { userId } = c.req.valid('param');
  const authUser = c.get('user');
  const body = c.req.valid('json');

  if (authUser.userId !== userId) {
    throw new AppError(403, 'You can only submit verification for your own account');
  }

  const userResult = await db.query(
    `SELECT role FROM "User" WHERE user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const userRole = userResult.rows[0].role;
  const submission = await verificationService.submitVerification(userId, userRole, body);

  return c.json(
    {
      success: true,
      data: submission,
      message: 'Documents submitted successfully. Awaiting admin review.',
    },
    201
  );
});

/**
 * GET /users/{userId}/verification/submission-status
 * Get submission status and history
 */
users.openapi(routes.getSubmissionStatusRoute, async (c) => {
  const { userId } = c.req.valid('param');
  const authUser = c.get('user');

  if (authUser.userId !== userId && authUser.role !== 'ADMIN') {
    throw new AppError(403, 'You can only access your own verification status');
  }

  const status = await verificationService.getSubmissionStatus(userId);

  return c.json(
    {
      success: true,
      data: status,
    },
    200
  );
});

export default users;

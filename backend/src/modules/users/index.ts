import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { db } from '@/db/client';
import { AppError } from '@/errors/base';
import * as routes from './routes';
import * as profileService from './services/profile.service';
import * as verificationService from './services/verification.service';
import { requireAuth } from '@/security';
import { dispatchTransliteration } from '@/services/transliteration';

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
 * GET /users/{userId}/profile-photo/download-url
 * Get presigned download URL for profile photo
 */
users.openapi(routes.getProfilePhotoDownloadUrlRoute, async (c) => {
  const { userId } = c.req.valid('param');
  const authUser = c.get('user');

  if (authUser.userId !== userId && authUser.role !== 'ADMIN') {
    throw new AppError(403, 'You can only access your own profile photo');
  }

  const presigned = await profileService.getProfilePhotoDownloadUrl(userId);

  return c.json(
    {
      success: true,
      data: presigned,
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
    `SELECT role, contact_phone FROM "User" WHERE user_id = $1`,
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

  const reqBody = body as any;
  dispatchTransliteration(
    {
      fullName: reqBody.firstName || reqBody.lastName ? `${reqBody.firstName || ''} ${reqBody.lastName || ''}`.trim() : undefined,
      profession: reqBody.profession,
      religion: reqBody.religion,
      phone: userResult.rows[0].contact_phone || undefined,
    },
    {
      table: 'BaseUserProfile',
      idColumn: 'user_id',
      idValue: userId,
    }
  );

  return c.json(
    {
      success: true,
      data: {
        userId,
        role: userRole,
        profileCompletionStatus: completionStatus,
        onboardingStatus: 'PROFILE_PENDING',
      },
      message: 'Profile created successfully. Next: submit required documents for verification.',
    },
    201
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
    `SELECT role, contact_phone FROM "User" WHERE user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const userRole = userResult.rows[0].role;
  await profileService.createOrUpdateProfile(userId, userRole, body as any);
  const completionStatus = await profileService.getProfileCompletionStatus(userId, userRole);

  const reqBody = body as any;
  dispatchTransliteration(
    {
      fullName: reqBody.firstName || reqBody.lastName ? `${reqBody.firstName || ''} ${reqBody.lastName || ''}`.trim() : undefined,
      profession: reqBody.profession,
      religion: reqBody.religion,
      phone: userResult.rows[0].contact_phone || undefined,
    },
    {
      table: 'BaseUserProfile',
      idColumn: 'user_id',
      idValue: userId,
    }
  );

  return c.json(
    {
      success: true,
      data: {
        userId,
        profileCompletionStatus: completionStatus,
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

  const reqBody = body as any;
  const nidDoc = reqBody.documents?.find((d: any) => d.documentType === 'NATIONAL_ID');
  if (nidDoc && nidDoc.documentNumber) {
    dispatchTransliteration(
      {
        nid: nidDoc.documentNumber,
      },
      {
        table: 'BaseUserProfile',
        idColumn: 'user_id',
        idValue: userId,
      }
    );
  }

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

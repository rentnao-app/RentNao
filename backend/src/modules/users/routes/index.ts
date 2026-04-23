import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import * as schemas from '../schemas';
import { UserRole } from '@/types/enums';

const userIdParamSchema = z.object({
  userId: z.string().openapi({
    param: { name: 'userId', in: 'path' },
    example: 'cm4abc123xyz',
    description: 'User ID',
  }),
});

const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string(),
});

// ============================================================================
// Profile Routes
// ============================================================================

export const getProfileStatusRoute = createRoute({
  method: 'get',
  path: '/{userId}/profile-status',
  tags: ['Users - Profile'],
  summary: 'Get profile completion & KYC verification status',
  request: {
    params: userIdParamSchema,
  },
  responses: {
    200: {
      description: 'Profile and verification status retrieved',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: schemas.profileStatusSchema,
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'User not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const createProfileRoute = createRoute({
  method: 'post',
  path: '/{userId}/profile',
  tags: ['Users - Profile'],
  summary: 'Create user profile (tenant or owner)',
  description: 'Create initial profile after contact verification. Role-specific fields required.',
  request: {
    params: userIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: schemas.createProfileRequestSchema,
          examples: {
            tenant: {
              summary: 'Tenant profile payload',
              value: {
                firstName: 'Arif',
                lastName: 'Rahman',
                dateOfBirth: '1995-05-15',
                gender: 'MALE',
                religion: 'Islam',
                profession: 'Software Engineer',
                jobCategory: 'TECHNOLOGY',
                profilePhotoUrl: 'https://example.com/photo.jpg',
                currentLat: 23.8103,
                currentLng: 90.4125,
                currentArea: 'Dhaka, Bangladesh',
                incomeRange: 'RANGE_40K_60K',
                employmentStatus: 'EMPLOYED',
                familyStatus: 'FAMILY',
                familySize: 4,
                role: 'TENANT',
              },
            },
            owner: {
              summary: 'Owner profile payload',
              value: {
                firstName: 'Arif',
                lastName: 'Rahman',
                dateOfBirth: '1995-05-15',
                gender: 'MALE',
                religion: 'Islam',
                profession: 'Real Estate Broker',
                jobCategory: 'SELF_EMPLOYED',
                profilePhotoUrl: 'https://example.com/photo.jpg',
                currentLat: 23.8103,
                currentLng: 90.4125,
                currentArea: 'Dhaka, Bangladesh',
                ownerCategory: 'RESIDENTIAL',
                role: 'OWNER',
              },
            },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Profile created successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              userId: z.string(),
              role: UserRole,
              profileCompletionStatus: z.object({
                isComplete: z.boolean(),
              }),
              onboardingStatus: z.string(),
            }),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: 'Profile already exists or conflict',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const updateProfileRoute = createRoute({
  method: 'patch',
  path: '/{userId}/profile',
  tags: ['Users - Profile'],
  summary: 'Update user profile',
  description: 'Update profile information',
  request: {
    params: userIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: z.union([
            schemas.updateTenantProfileSchema.merge(z.object({ role: z.literal('TENANT').optional() })),
            schemas.updateOwnerProfileSchema.merge(z.object({ role: z.literal('OWNER').optional() })),
          ]),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Profile updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              userId: z.string(),
              profileCompletionStatus: z.object({
                isComplete: z.boolean(),
              }),
            }),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: 'Validation error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'User or profile not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

// ============================================================================
// Verification Routes
// ============================================================================

export const getRequiredDocumentsRoute = createRoute({
  method: 'get',
  path: '/{userId}/verification/required-documents',
  tags: ['Users - Verification'],
  summary: 'List required documents for KYC',
  description: 'Get list of documents required for user role verification',
  request: {
    params: userIdParamSchema,
  },
  responses: {
    200: {
      description: 'Required documents retrieved',
      content: {
        'application/json': {
          schema: schemas.requiredDocumentsResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const getUploadUrlRoute = createRoute({
  method: 'post',
  path: '/{userId}/verification/upload-url',
  tags: ['Users - Verification'],
  summary: 'Get presigned upload URL for document',
  description: 'Generate presigned S3 URL for uploading a KYC document',
  request: {
    params: userIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: schemas.uploadUrlRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Presigned URL generated',
      content: {
        'application/json': {
          schema: schemas.uploadUrlResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid file type',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const submitVerificationRoute = createRoute({
  method: 'post',
  path: '/{userId}/verification/submit',
  tags: ['Users - Verification'],
  summary: 'Submit KYC documents for verification',
  description: 'Submit required KYC documents for admin review',
  request: {
    params: userIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: schemas.submitVerificationSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Verification submitted successfully',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              submissionId: z.string(),
              status: z.string(),
              submittedAt: z.string().datetime(),
              documentCount: z.number(),
            }),
            message: z.string(),
          }),
        },
      },
    },
    400: {
      description: 'Validation error or missing required documents',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: 'Submission already in progress or conflict',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const getSubmissionStatusRoute = createRoute({
  method: 'get',
  path: '/{userId}/verification/submission-status',
  tags: ['Users - Verification'],
  summary: 'Get verification submission history & current status',
  description: 'Retrieve submission status and timeline',
  request: {
    params: userIdParamSchema,
  },
  responses: {
    200: {
      description: 'Submission status retrieved',
      content: {
        'application/json': {
          schema: schemas.verificationStatusResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
});

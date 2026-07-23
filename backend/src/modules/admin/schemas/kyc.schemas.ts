import { z } from '@hono/zod-openapi';
import {
  UserRole,
  KycVerificationStatus,
  VerificationSubmissionStatus,
  DocumentVerificationStatus,
  IdentityDocumentType,
  OnboardingStatus,
} from '@/types/enums';
import { paginationQuerySchema } from './common.schemas';

export const kycSubmissionsQuerySchema = paginationQuerySchema.extend({
  status: VerificationSubmissionStatus.optional().openapi({
    example: 'SUBMITTED',
    description: 'Filter by submission status',
  }),
  role: UserRole.optional().openapi({
    example: 'TENANT',
    description: 'Filter by user role',
  }),
  sortBy: z.enum(['submittedAt', 'createdAt']).optional().default('submittedAt').openapi({
    example: 'submittedAt',
    description: 'Field to sort by',
  }),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc').openapi({
    example: 'desc',
    description: 'Sort direction',
  }),
});

export type KycSubmissionsQuery = z.infer<typeof kycSubmissionsQuerySchema>;

const kycSubmissionListSchema = z.object({
  submissionId: z.string(),
  userId: z.string(),
  userEmail: z.string().email(),
  userRole: UserRole,
  status: VerificationSubmissionStatus,
  submittedAt: z.string().datetime(),
  documentCount: z.number(),
  daysWaiting: z.number(),
});

export const kycSubmissionsListResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    submissions: z.array(kycSubmissionListSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  }),
});

const documentDetailSchema = z.object({
  documentId: z.string(),
  documentType: IdentityDocumentType,
  documentNumber: z.string().optional(),
  fileName: z.string(),
  mimeType: z.string(),
  fileSizeBytes: z.number().optional(),
  uploadedAt: z.string().datetime(),
  verificationStatus: DocumentVerificationStatus,
  reviewedAt: z.string().datetime().optional(),
  reviewerNotes: z.string().optional(),
  filePath: z.string().nullable().optional(),
  signedUrl: z.string().url().nullable().optional(),
});

export const kycSubmissionDetailResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    submissionId: z.string(),
    userId: z.string(),
    userEmail: z.string().email(),
    userPhone: z.string().nullable().optional(),
    userRole: UserRole,
    displayName: z.string(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    fullNameBn: z.string().nullable().optional(),
    dateOfBirth: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    profilePhotoUrl: z.string().url().nullable().optional(),
    status: VerificationSubmissionStatus,
    submittedAt: z.string().datetime(),
    reviewedAt: z.string().datetime().optional(),
    rejectionReason: z.string().optional(),
    documents: z.array(documentDetailSchema),
  }),
});

export const reviewKycSubmissionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']).openapi({
    example: 'APPROVED',
    description: 'Approval decision',
  }),
  rejectionReason: z.string().min(10).optional().openapi({
    example: 'Document quality is too low',
    description: 'Reason for rejection (required if REJECTED)',
  }),
});

export type ReviewKycSubmissionInput = z.infer<typeof reviewKycSubmissionSchema>;

export const reviewKycResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    submissionId: z.string(),
    userId: z.string(),
    status: VerificationSubmissionStatus,
    reviewedAt: z.string().datetime(),
    userKycStatus: KycVerificationStatus,
    userOnboardingStatus: OnboardingStatus,
  }),
  message: z.string(),
});

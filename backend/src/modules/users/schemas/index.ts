import { z } from '@hono/zod-openapi';
import { UserRole, OnboardingStatus, KycVerificationStatus, IdentityDocumentType, DocumentVerificationStatus, VerificationSubmissionStatus } from '@/types/enums';

// ============================================================================
// Profile Schemas - Tenant
// ============================================================================

export const createTenantProfileSchema = z.object({
  // Base profile (all required)
  firstName: z.string().min(2).max(50).openapi({
    example: 'Ahmed',
    description: 'First name',
  }),
  lastName: z.string().min(2).max(50).openapi({
    example: 'Rahman',
    description: 'Last name',
  }),
  fatherName: z.string().min(2).max(100).openapi({
    example: 'Karim Rahman',
    description: 'Father name',
  }),
  motherName: z.string().min(2).max(100).openapi({
    example: 'Fatema Begum',
    description: 'Mother name',
  }),
  fatherNameBn: z.string().min(2).max(100).optional().openapi({
    example: 'করিম রহমান',
    description: 'Father name in Bengali',
  }),
  motherNameBn: z.string().min(2).max(100).optional().openapi({
    example: 'ফাতেমা বেগম',
    description: 'Mother name in Bengali',
  }),
  dateOfBirth: z.string().date().openapi({
    example: '1995-05-15',
    description: 'Date of birth (YYYY-MM-DD)',
  }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).openapi({
    example: 'MALE',
    description: 'Gender',
  }),
  religion: z.string().min(1).max(100).openapi({
    example: 'Islam',
    description: 'Religion',
  }),
  profession: z.string().min(1).max(100).openapi({
    example: 'Software Engineer',
    description: 'Profession',
  }),
  jobCategory: z.enum(['TECHNOLOGY', 'HEALTHCARE', 'EDUCATION', 'FINANCE', 'CONSTRUCTION', 'HOSPITALITY', 'RETAIL', 'GOVERNMENT', 'SELF_EMPLOYED', 'OTHER']).openapi({
    example: 'TECHNOLOGY',
    description: 'Job category',
  }),
  profilePhotoKey: z.string().min(1).optional().openapi({
    example: 'profiles/user123/avatar-1710000000000.jpg',
    description: 'S3 file key for profile photo',
  }),
  currentLat: z.number().openapi({
    example: 23.8103,
    description: 'Current latitude',
  }),
  currentLng: z.number().openapi({
    example: 90.4125,
    description: 'Current longitude',
  }),
  currentArea: z.string().min(1).max(500).openapi({
    example: 'Dhaka, Bangladesh',
    description: 'Current area/location name',
  }),
  
  // Tenant-specific (all required)
  incomeRange: z.enum(['BELOW_20K', 'RANGE_20K_40K', 'RANGE_40K_60K', 'RANGE_60K_100K', 'RANGE_100K_200K', 'ABOVE_200K']).openapi({
    example: 'RANGE_40K_60K',
    description: 'Monthly income range in BDT',
  }),
  employmentStatus: z.enum(['EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'STUDENT', 'RETIRED']).openapi({
    example: 'EMPLOYED',
    description: 'Employment status',
  }),
  familyStatus: z.enum(['FAMILY', 'BACHELOR']).openapi({
    example: 'FAMILY',
    description: 'Family status',
  }),
  familySize: z.number().int().min(1).openapi({
    example: 4,
    description: 'Family size / number of members',
  }),
});

export type CreateTenantProfileInput = z.infer<typeof createTenantProfileSchema>;

export const createOwnerProfileSchema = z.object({
  // Base profile (all required)
  firstName: z.string().min(2).max(50).openapi({
    example: 'Mohammed',
    description: 'First name',
  }),
  lastName: z.string().min(2).max(50).openapi({
    example: 'Hassan',
    description: 'Last name',
  }),
  fatherName: z.string().min(2).max(100).openapi({
    example: 'Abul Hassan',
    description: 'Father name',
  }),
  motherName: z.string().min(2).max(100).openapi({
    example: 'Sufia Khatun',
    description: 'Mother name',
  }),
  fatherNameBn: z.string().min(2).max(100).optional().openapi({
    example: 'আবুল হাসান',
    description: 'Father name in Bengali',
  }),
  motherNameBn: z.string().min(2).max(100).optional().openapi({
    example: 'সুফিয়া খাতুন',
    description: 'Mother name in Bengali',
  }),
  dateOfBirth: z.string().date().openapi({
    example: '1990-03-20',
    description: 'Date of birth (YYYY-MM-DD)',
  }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).openapi({
    example: 'MALE',
    description: 'Gender',
  }),
  religion: z.string().min(1).max(100).openapi({
    example: 'Islam',
    description: 'Religion',
  }),
  profession: z.string().min(1).max(100).openapi({
    example: 'Real Estate Broker',
    description: 'Profession',
  }),
  jobCategory: z.enum(['TECHNOLOGY', 'HEALTHCARE', 'EDUCATION', 'FINANCE', 'CONSTRUCTION', 'HOSPITALITY', 'RETAIL', 'GOVERNMENT', 'SELF_EMPLOYED', 'OTHER']).openapi({
    example: 'SELF_EMPLOYED',
    description: 'Job category',
  }),
  profilePhotoKey: z.string().min(1).optional().openapi({
    example: 'profiles/user123/avatar-1710000000000.jpg',
    description: 'S3 file key for profile photo',
  }),
  currentLat: z.number().openapi({
    example: 23.8103,
    description: 'Current latitude',
  }),
  currentLng: z.number().openapi({
    example: 90.4125,
    description: 'Current longitude',
  }),
  currentArea: z.string().min(1).max(500).openapi({
    example: 'Gulshan, Dhaka',
    description: 'Current area/location name',
  }),
  
  // Owner-specific (all required)
  ownerCategory: z.enum(['RESIDENTIAL', 'COMMERCIAL']).openapi({
    example: 'RESIDENTIAL',
    description: 'Type of properties owner manages',
  }),
});

export type CreateOwnerProfileInput = z.infer<typeof createOwnerProfileSchema>;

export const createProfileRequestSchema = z.discriminatedUnion('role', [
  createTenantProfileSchema.merge(z.object({ role: z.literal('TENANT') })),
  createOwnerProfileSchema.merge(z.object({ role: z.literal('OWNER') })),
]);

export type CreateProfileRequestInput = z.infer<typeof createProfileRequestSchema>;

export const updateTenantProfileSchema = createTenantProfileSchema.partial();
export const updateOwnerProfileSchema = createOwnerProfileSchema.partial();

// ============================================================================
// Profile Status Schema
// ============================================================================

export const profileCompletionSectionSchema = z.object({
  isComplete: z.boolean().openapi({
    example: true,
  }),
  filledFields: z.array(z.string()).openapi({
    example: ['firstName', 'lastName', 'dateOfBirth'],
  }),
  missingFields: z.array(z.string()).openapi({
    example: [],
  }),
});

export const profileStatusSchema = z.object({
  userId: z.string().openapi({
    example: 'cm4abc123xyz',
  }),
  role: UserRole.openapi({
    example: 'TENANT',
  }),
  onboardingStatus: OnboardingStatus.openapi({
    example: 'PROFILE_PENDING',
  }),
  kycVerificationStatus: KycVerificationStatus.openapi({
    example: 'PENDING',
  }),
  contactEmail: z.string().email().nullable().optional().openapi({
    example: 'user@example.com',
  }),
  contactPhone: z.string().nullable().optional().openapi({
    example: '+8801712345678',
  }),
  profileCompletion: z.object({
    base: profileCompletionSectionSchema,
    roleSpecific: profileCompletionSectionSchema,
    overall: z.boolean().openapi({
      example: false,
      description: 'True only if both base and roleSpecific are complete',
    }),
  }),
  profile: z.object({
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    dateOfBirth: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    religion: z.string().nullable().optional(),
    profession: z.string().nullable().optional(),
    jobCategory: z.string().nullable().optional(),
    profilePhotoKey: z.string().nullable().optional(),
    currentLat: z.number().nullable().optional(),
    currentLng: z.number().nullable().optional(),
    currentArea: z.string().nullable().optional(),
    incomeRange: z.string().nullable().optional(),
    employmentStatus: z.string().nullable().optional(),
    familyStatus: z.string().nullable().optional(),
    familySize: z.number().nullable().optional(),
    ownerCategory: z.string().nullable().optional(),
    fullNameBn: z.string().nullable().optional(),
    professionBn: z.string().nullable().optional(),
    religionBn: z.string().nullable().optional(),
    phoneBn: z.string().nullable().optional(),
    nidBn: z.string().nullable().optional(),
  }).optional(),
  requiredDocuments: z.array(
    z.object({
      documentType: IdentityDocumentType.openapi({
        example: 'NATIONAL_ID',
      }),
      description: z.string().openapi({
        example: 'National ID Card',
      }),
      uploadStatus: DocumentVerificationStatus.optional().openapi({
        example: 'PENDING',
      }),
    })
  ),
});

export type ProfileStatus = z.infer<typeof profileStatusSchema>;

// ============================================================================
// Verification Schemas
// ============================================================================

export const requiredDocumentsResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    userId: z.string(),
    role: UserRole,
    requiredDocuments: z.array(
      z.object({
        documentType: IdentityDocumentType,
        description: z.string(),
      })
    ),
  }),
});

export const uploadUrlRequestSchema = z.object({
  documentType: IdentityDocumentType.openapi({
    example: 'NATIONAL_ID',
  }),
  fileName: z.string().regex(/\.(pdf|jpg|jpeg|png)$/i).openapi({
    example: 'national_id.pdf',
    description: 'File name with extension (.pdf, .jpg, .jpeg, .png)',
  }),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']).openapi({
    example: 'application/pdf',
  }),
});

export type UploadUrlRequest = z.infer<typeof uploadUrlRequestSchema>;

export const uploadUrlResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    uploadUrl: z.string().url().openapi({
      example: 'https://s3.example.com/kyc/user123/national-id.pdf?...',
      description: 'Presigned URL for PUT upload',
    }),
    expiresIn: z.number().openapi({
      example: 3600,
      description: 'URL expiration time in seconds',
    }),
    fileKey: z.string().openapi({
      example: 'kyc/user123/national-id-1234567890.pdf',
      description: 'S3 file key for tracking',
    }),
  }),
});

export const profilePhotoUploadUrlRequestSchema = z.object({
  fileName: z.string().regex(/\.(jpg|jpeg|png|webp)$/i).openapi({
    example: 'profile-photo.jpg',
    description: 'File name with extension (.jpg, .jpeg, .png, .webp)',
  }),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).openapi({
    example: 'image/jpeg',
  }),
});

export type ProfilePhotoUploadUrlRequest = z.infer<typeof profilePhotoUploadUrlRequestSchema>;

export const profilePhotoDownloadUrlResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    downloadUrl: z.string().url().openapi({
      example: 'https://s3.example.com/profiles/user123/avatar-1710000000000.jpg?...',
      description: 'Presigned URL for GET download',
    }),
    expiresIn: z.number().openapi({
      example: 3600,
      description: 'URL expiration time in seconds',
    }),
  }),
});

export const submitVerificationSchema = z.object({
  documents: z
    .array(
      z.object({
        documentType: IdentityDocumentType,
        filePath: z.string().openapi({
          example: 'kyc/user123/national-id-1234567890.pdf',
        }),
        fileName: z.string(),
        mimeType: z.string(),
        fileSizeBytes: z.number(),
        documentNumber: z.string().optional(),
      })
    )
    .min(1, 'At least one document is required')
    .openapi({
      description: 'Array of documents to submit',
    }),
});

export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;

export const submissionStatusSchema = z.object({
  submissionId: z.string(),
  status: VerificationSubmissionStatus,
  submittedAt: z.string().datetime(),
  reviewedAt: z.string().datetime().optional(),
  documents: z.array(
    z.object({
      documentId: z.string(),
      documentType: IdentityDocumentType,
      verificationStatus: DocumentVerificationStatus,
      uploadedAt: z.string().datetime(),
      rejectionReason: z.string().optional(),
    })
  ),
});

export const verificationStatusResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    currentSubmission: submissionStatusSchema.optional(),
    timeline: z.array(
      z.object({
        submissionId: z.string(),
        status: VerificationSubmissionStatus,
        timestampUtc: z.string().datetime(),
        reviewerNotes: z.string().optional(),
      })
    ),
  }),
});

// KYC Schemas
// ============================================================================

export const identityVerifyInputSchema = z.object({
  fullName: z.string(),
  dateOfBirth: z.string(), // YYYY-MM-DD
  nationalId: z.string(),
  mobile: z.string().optional(),
  referenceId: z.string(),
});

export type IdentityVerifyInput = z.infer<typeof identityVerifyInputSchema>;

export const kycBdResponseSchema = z.object({
  status: z.string(),
  verification_id: z.string().optional(),
  match_score: z.number().optional(),
  risk_level: z.string().optional(),
  timestamp: z.string().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type KycBdResponse = z.infer<typeof kycBdResponseSchema>;

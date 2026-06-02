/**
 * Centralized enums matching Prisma schema
 * Single source of truth for all enum types
 */

import { z } from '@hono/zod-openapi';

// ============================================================================
// User & Auth Enums
// ============================================================================

export const UserRole = z.enum(['TENANT', 'OWNER', 'ADMIN']);
export type UserRoleType = z.infer<typeof UserRole>;

export const OnboardingStatus = z.enum([
  'PHONE_REQUIRED',
  'PHONE_VERIFICATION_PENDING',
  'PROFILE_PENDING',
  'UNDER_REVIEW',
  'COMPLETED',
]);
export type OnboardingStatusType = z.infer<typeof OnboardingStatus>;

export const Verification = z.enum(['ACCEPTED', 'REJECTED', 'PENDING']);
export type VerificationType = z.infer<typeof Verification>;

export const IdentifierType = z.enum(['EMAIL', 'PHONE']);
export type IdentifierTypeType = z.infer<typeof IdentifierType>;

export const OAuthProvider = z.enum(['GOOGLE', 'FACEBOOK']);
export type OAuthProviderType = z.infer<typeof OAuthProvider>;

export const VerificationTokenType = z.enum([
  'EMAIL_VERIFICATION',
  'PHONE_VERIFICATION',
  'PASSWORD_RESET',
  'MAGIC_LINK',
]);
export type VerificationTokenTypeType = z.infer<typeof VerificationTokenType>;

// KYC Verification Enums
export const KycVerificationStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type KycVerificationStatusType = z.infer<typeof KycVerificationStatus>;

export const VerificationSubmissionStatus = z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED']);
export type VerificationSubmissionStatusType = z.infer<typeof VerificationSubmissionStatus>;

export const DocumentVerificationStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type DocumentVerificationStatusType = z.infer<typeof DocumentVerificationStatus>;

export const IdentityDocumentType = z.enum(['NATIONAL_ID', 'BIRTH_REGISTRATION', 'PROOF_OF_OWNERSHIP']);
export type IdentityDocumentTypeType = z.infer<typeof IdentityDocumentType>;

// ============================================================================
// Profile Enums
// ============================================================================

export const Gender = z.enum(['MALE', 'FEMALE', 'OTHER']);
export type GenderType = z.infer<typeof Gender>;

export const FamilyStatus = z.enum(['FAMILY', 'BACHELOR']);
export type FamilyStatusType = z.infer<typeof FamilyStatus>;

export const EmploymentStatus = z.enum([
  'EMPLOYED',
  'SELF_EMPLOYED',
  'UNEMPLOYED',
  'STUDENT',
  'RETIRED',
]);
export type EmploymentStatusType = z.infer<typeof EmploymentStatus>;

export const JobCategory = z.enum([
  'TECHNOLOGY',
  'HEALTHCARE',
  'EDUCATION',
  'FINANCE',
  'CONSTRUCTION',
  'HOSPITALITY',
  'RETAIL',
  'GOVERNMENT',
  'SELF_EMPLOYED',
  'OTHER',
]);
export type JobCategoryType = z.infer<typeof JobCategory>;

export const IncomeRange = z.enum([
  'BELOW_20K',
  'RANGE_20K_40K',
  'RANGE_40K_60K',
  'RANGE_60K_100K',
  'RANGE_100K_200K',
  'ABOVE_200K',
]);
export type IncomeRangeType = z.infer<typeof IncomeRange>;

// ============================================================================
// Property Enums
// ============================================================================

export const TenantType = z.enum(['FAMILY', 'BACHELOR', 'BOTH']);
export type TenantTypeType = z.infer<typeof TenantType>;

export const PropertyCategory = z.enum(['RESIDENTIAL', 'COMMERCIAL']);
export type PropertyCategoryType = z.infer<typeof PropertyCategory>;

export const PropertyType = z.enum(['APARTMENT']);
export type PropertyTypeType = z.infer<typeof PropertyType>;

export const AreaName = z.enum([
  'DHANMONDI',
  'GULSHAN',
  'BANANI',
  'UTTARA',
  'MIRPUR',
  'MOHAMMADPUR',
  'BASHUNDHARA',
  'BADDA',
]);
export type AreaNameType = z.infer<typeof AreaName>;

export const BuildingFacing = z.enum(['EAST', 'WEST', 'NORTH', 'SOUTH']);
export type BuildingFacingType = z.infer<typeof BuildingFacing>;

export const ListingStatus = z.enum([
  'DRAFT',
  'PENDING_PAYMENT',
  'ACTIVE',
  'RENTED',
  'UNLISTED',
  'EXPIRED',
]);
export type ListingStatusType = z.infer<typeof ListingStatus>;

// ============================================================================
// Wallet & Billing Enums
// ============================================================================

export const WalletStatus = z.enum(['ACTIVE', 'INACTIVE']);
export type WalletStatusType = z.infer<typeof WalletStatus>;

export const WalletTxnDirection = z.enum(['CREDIT', 'DEBIT']);
export type WalletTxnDirectionType = z.infer<typeof WalletTxnDirection>;

export const WalletTxnType = z.enum(['TOPUP', 'LISTING_FEE', 'REFUND', 'ADJUSTMENT', 'REVERSAL']);
export type WalletTxnTypeType = z.infer<typeof WalletTxnType>;

export const WalletTxnStatus = z.enum(['PENDING', 'POSTED', 'FAILED', 'REVERSED']);
export type WalletTxnStatusType = z.infer<typeof WalletTxnStatus>;

export const ChargeStatus = z.enum(['PENDING', 'SETTLED', 'FAILED', 'VOID']);
export type ChargeStatusType = z.infer<typeof ChargeStatus>;

export const TopupRequestStatus = z.enum(['PENDING', 'APPROVED', 'REJECTED']);
export type TopupRequestStatusType = z.infer<typeof TopupRequestStatus>;

export const TopupProvider = z.enum(['BKASH']);
export type TopupProviderType = z.infer<typeof TopupProvider>;

export const TopupStatus = z.enum(['PENDING', 'SUCCESS', 'FAILED', 'EXPIRED']);
export type TopupStatusType = z.infer<typeof TopupStatus>;

// Chat Enums

export const ConversationStatus = z.enum(['PENDING', 'ACCEPTED', 'CLOSED']);
export type ConversationStatusType = z.infer<typeof ConversationStatus>;
export const DiscountType = z.enum(['FIXED', 'PERCENTAGE']);
export type DiscountTypeType = z.infer<typeof DiscountType>;

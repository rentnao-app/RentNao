import type { UserRoleType, IdentityDocumentTypeType } from '@/types/enums';

/**
 * Hardcoded document requirements per role
 * Tenant: 1-2 NID images
 * Owner: 1-2 NID images + 1 proof of ownership document
 */
export const REQUIRED_DOCUMENTS_BY_ROLE: Record<UserRoleType, IdentityDocumentTypeType[]> = {
  TENANT: ['NATIONAL_ID'],
  OWNER: ['NATIONAL_ID', 'PROOF_OF_OWNERSHIP'],
  ADMIN: [],
};

/**
 * Human-readable descriptions for document types
 */
export const DOCUMENT_DESCRIPTIONS: Record<IdentityDocumentTypeType, string> = {
  NATIONAL_ID: 'National ID Card',
  BIRTH_REGISTRATION: 'Birth Registration Certificate',
  PROOF_OF_OWNERSHIP: 'Proof of Property Ownership (deed, certificate, or agreement)',
};

/**
 * Allowed MIME types for document uploads
 */
export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'] as const;

/**
 * Maximum file size for document uploads (10MB)
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

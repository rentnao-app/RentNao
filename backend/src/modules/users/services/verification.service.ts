import { db } from '@/db/client';
import { storage } from '@/db/s3';
import { AppError } from '@/errors/base';
import { REQUIRED_DOCUMENTS_BY_ROLE, ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../utils/constants';
import type {
  UserRoleType,
  IdentityDocumentTypeType,
  VerificationSubmissionStatusType,
  DocumentVerificationStatusType,
} from '@/types/enums';
import type { UploadUrlRequest, SubmitVerificationInput } from '../schemas';

function createId() {
  return crypto.randomUUID();
}

/**
 * Generate presigned upload URL for a document
 */
export async function getDocumentUploadUrl(
  userId: string,
  request: UploadUrlRequest
): Promise<{ uploadUrl: string; expiresIn: number; fileKey: string }> {
  const { documentType, fileName, mimeType } = request;

  // Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    throw new AppError(400, `Invalid MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
  }

  // Generate S3 file key
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const fileKey = `kyc/${userId}/${documentType.toLowerCase()}-${timestamp}.${extension}`;

  // Get presigned URL
  const presigned = await storage.presignUpload(fileKey, {
    fileName,
    mimeType,
    maxSizeBytes: MAX_FILE_SIZE_BYTES,
    allowedMimeTypes: ALLOWED_MIME_TYPES as unknown as string[],
  });

  return {
    uploadUrl: presigned.uploadUrl,
    expiresIn: presigned.expiresIn,
    fileKey,
  };
}

/**
 * Submit verification documents
 * Validates all required documents for role are present
 */
export async function submitVerification(
  userId: string,
  userRole: UserRoleType,
  input: SubmitVerificationInput
): Promise<{
  submissionId: string;
  status: string;
  submittedAt: string;
  documentCount: number;
}> {
  // Verify user exists and profile is complete
  const userResult = await db.query(
    `SELECT u.user_id, u.onboarding_status, bp.id as profile_id
     FROM "User" u
     LEFT JOIN "BaseUserProfile" bp ON u.user_id = bp.user_id
     WHERE u.user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const { profile_id } = userResult.rows[0];
  if (!profile_id) {
    throw new AppError(403, 'Profile must be completed before submitting documents');
  }

  // Verify all required documents are present
  const requiredDocs = REQUIRED_DOCUMENTS_BY_ROLE[userRole] || [];
  const submittedDocTypes = input.documents.map((d) => d.documentType);
  const nidDocs = input.documents.filter((d) => d.documentType === 'NATIONAL_ID');
  const ownershipDocs = input.documents.filter((d) => d.documentType === 'PROOF_OF_OWNERSHIP');

  const missingDocs = requiredDocs.filter((req) => !submittedDocTypes.includes(req));
  if (missingDocs.length > 0) {
    throw new AppError(400, `Missing required documents: ${missingDocs.join(', ')}`);
  }

  // Allow one optional extra NID image, but keep the ownership document single-use.
  if (nidDocs.length < 1) {
    throw new AppError(400, 'At least one NID image is required');
  }

  if (nidDocs.length > 2) {
    throw new AppError(400, 'You can upload at most two NID images');
  }

  if (userRole === 'TENANT' && ownershipDocs.length > 0) {
    throw new AppError(400, 'Tenants should only upload NID images');
  }

  if (userRole === 'OWNER') {
    if (ownershipDocs.length !== 1) {
      throw new AppError(400, 'Owners must upload one proof of ownership document');
    }

    if (input.documents.length < 2 || input.documents.length > 3) {
      throw new AppError(400, 'Owners can upload two or three documents total');
    }
  } else if (input.documents.length < 1 || input.documents.length > 2) {
    throw new AppError(400, 'Tenants can upload one or two documents total');
  }

  // Validate each uploaded object belongs to this user and exists in storage
  for (const doc of input.documents) {
    const expectedPrefix = `kyc/${userId}/`;
    if (!doc.filePath.startsWith(expectedPrefix)) {
      throw new AppError(400, `Invalid file path for ${doc.documentType}. File must be uploaded under ${expectedPrefix}`);
    }

    if (!ALLOWED_MIME_TYPES.includes(doc.mimeType as any)) {
      throw new AppError(400, `Invalid MIME type for ${doc.documentType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    if (!doc.fileSizeBytes || doc.fileSizeBytes <= 0 || doc.fileSizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new AppError(400, `Invalid file size for ${doc.documentType}. Max allowed is ${MAX_FILE_SIZE_BYTES} bytes`);
    }

    const exists = await storage.exists(doc.filePath);
    if (!exists) {
      throw new AppError(400, `Uploaded file not found for ${doc.documentType}. Please upload again.`);
    }
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Check if there's an active submission
    const existingSubmissionResult = await client.query(
      `SELECT id, submission_status FROM "VerificationSubmission" 
       WHERE user_id = $1`,
      [userId]
    );

    let submissionId: string;

    if (existingSubmissionResult.rows.length > 0) {
      const existingSubmission = existingSubmissionResult.rows[0];

      if (existingSubmission.submission_status === 'SUBMITTED' || existingSubmission.submission_status === 'UNDER_REVIEW') {
        throw new AppError(409, 'A verification submission is already pending review');
      }

      if (existingSubmission.submission_status === 'APPROVED') {
        throw new AppError(409, 'Your account is already verified');
      }

      // Reuse existing submission record for DRAFT/REJECTED states
      submissionId = existingSubmissionResult.rows[0].id;

      // Delete old documents for this submission
      await client.query(
        `DELETE FROM "UserIdentityDocument" WHERE submission_id = $1`,
        [submissionId]
      );

      // Update submission status
      await client.query(
        `UPDATE "VerificationSubmission" 
         SET submission_status = 'SUBMITTED', submitted_at = NOW(), rejection_reason = NULL, updated_at = NOW()
         WHERE id = $1`,
        [submissionId]
      );
    } else {
      // Create new submission
      const createResult = await client.query(
        `INSERT INTO "VerificationSubmission" (id, user_id, submission_status, submitted_at)
         VALUES ($1, $2, 'SUBMITTED', NOW())
         RETURNING id`,
        [createId(), userId]
      );
      submissionId = createResult.rows[0].id;
    }

    // Insert documents
    for (const doc of input.documents) {
      await client.query(
        `INSERT INTO "UserIdentityDocument" 
         (id, user_id, submission_id, document_type, file_path, file_name, mime_type, file_size_bytes, document_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          createId(),
          userId,
          submissionId,
          doc.documentType,
          doc.filePath,
          doc.fileName,
          doc.mimeType,
          doc.fileSizeBytes,
          doc.documentNumber || null,
        ]
      );
    }

    // Update User KYC status to PENDING (awaiting admin review)
    await client.query(
      `UPDATE "User" 
       SET kyc_verification_status = 'PENDING', onboarding_status = 'UNDER_REVIEW', updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );

    await client.query('COMMIT');

    const now = new Date().toISOString();

    return {
      submissionId,
      status: 'SUBMITTED',
      submittedAt: now,
      documentCount: input.documents.length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Get verification submission status
 */
export async function getSubmissionStatus(userId: string) {
  // Get current submission
  const currentResult = await db.query(
    `SELECT vs.id, vs.submission_status, vs.submitted_at, vs.reviewed_at, vs.rejection_reason
     FROM "VerificationSubmission" vs
     WHERE vs.user_id = $1 AND submission_status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED')
     ORDER BY submitted_at DESC
     LIMIT 1`,
    [userId]
  );

  let currentSubmission: {
    submissionId: string;
    status: VerificationSubmissionStatusType;
    submittedAt: string;
    reviewedAt?: string;
    rejectionReason?: string;
    documents: Array<{
      documentId: string;
      documentType: IdentityDocumentTypeType;
      verificationStatus: DocumentVerificationStatusType;
      uploadedAt: string;
      rejectionReason?: string;
    }>;
  } | undefined;
  if (currentResult.rows.length > 0) {
    const submission = currentResult.rows[0];

    // Get documents for this submission
    const docsResult = await db.query(
      `SELECT id, document_type, verification_status, uploaded_at, rejection_reason
       FROM "UserIdentityDocument"
       WHERE submission_id = $1`,
      [submission.id]
    );

    currentSubmission = {
      submissionId: submission.id,
      status: submission.submission_status as VerificationSubmissionStatusType,
      submittedAt: submission.submitted_at.toISOString(),
      reviewedAt: submission.reviewed_at?.toISOString(),
      rejectionReason:
        submission.submission_status === 'REJECTED' ? submission.rejection_reason : undefined,
      documents: docsResult.rows.map((doc) => ({
        documentId: doc.id,
        documentType: doc.document_type as IdentityDocumentTypeType,
        verificationStatus: doc.verification_status as DocumentVerificationStatusType,
        uploadedAt: doc.uploaded_at.toISOString(),
        rejectionReason: doc.verification_status === 'REJECTED' ? doc.rejection_reason : undefined,
      })),
    };
  }

  // Get timeline (all submissions)
  const timelineResult = await db.query(
    `SELECT id, submission_status, submitted_at
     FROM "VerificationSubmission"
     WHERE user_id = $1
     ORDER BY submitted_at DESC`,
    [userId]
  );

  const timeline = timelineResult.rows
    .filter((row) => row.submitted_at)
    .map((row) => ({
    submissionId: row.id,
    status: row.submission_status as VerificationSubmissionStatusType,
    timestampUtc: row.submitted_at.toISOString(),
  }));

  return {
    currentSubmission,
    timeline,
  };
}

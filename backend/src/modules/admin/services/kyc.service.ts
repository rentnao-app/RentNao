import { db } from '@/db/client';
import { storage } from '@/db/s3';
import { UserNotFoundError } from '@/errors';
import { AppError } from '@/errors/base';
import type { PaginationMeta } from '@/types/common';

async function presignDocumentUrl(filePath: string | null | undefined): Promise<string | null> {
  if (!filePath) return null;

  try {
    return await storage.presignDownload(filePath, 3600);
  } catch {
    return null;
  }
}

export async function listKycSubmissions(query: any, currentUserId: string) {
  const { page = 1, limit = 10, status, role, sortBy = 'submittedAt', sortDir = 'desc' } = query;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`vs.submission_status = $${paramIndex++}`);
    params.push(status);
  }

  if (role) {
    conditions.push(`u.role = $${paramIndex++}`);
    params.push(role);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*) as total FROM "VerificationSubmission" vs
     JOIN "User" u ON vs.user_id = u.user_id
     ${whereClause}`,
    params
  );

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  const sortFieldMap: Record<string, string> = {
    submittedAt: 'vs.submitted_at',
    createdAt: 'vs.created_at',
  };
  const sortField = sortFieldMap[sortBy] || 'vs.submitted_at';

  params.push(limit, offset);
  const submissionsResult = await db.query(
    `SELECT vs.id, vs.user_id, vs.submission_status, vs.submitted_at, u.contact_email, u.role,
            COUNT(uid.id) as doc_count
     FROM "VerificationSubmission" vs
     JOIN "User" u ON vs.user_id = u.user_id
     LEFT JOIN "UserIdentityDocument" uid ON vs.id = uid.submission_id
     ${whereClause}
     GROUP BY vs.id, vs.user_id, vs.submission_status, vs.submitted_at, u.contact_email, u.role
     ORDER BY ${sortField} ${sortDir.toUpperCase()}
     LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
    params
  );

  const submissions = submissionsResult.rows.map((row: any) => {
    const now = new Date();
    const submittedAt = new Date(row.submitted_at);
    const daysWaiting = Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60 * 24));

    return {
      submissionId: row.id,
      userId: row.user_id,
      userEmail: row.contact_email,
      userRole: row.role,
      status: row.submission_status,
      submittedAt: row.submitted_at,
      documentCount: parseInt(row.doc_count),
      daysWaiting,
    };
  });

  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
  };

  return { submissions, pagination };
}

export async function getKycSubmissionDetail(submissionId: string) {
  const submissionResult = await db.query(
    `SELECT vs.id, vs.user_id, vs.submission_status, vs.submitted_at, vs.reviewed_at, 
            vs.rejection_reason, u.contact_email, u.contact_phone, u.role,
            bp.first_name, bp.last_name, bp.profile_picture_path,
            bp.full_name_bn, bp.date_of_birth, bp.gender
     FROM "VerificationSubmission" vs
     JOIN "User" u ON vs.user_id = u.user_id
     LEFT JOIN "BaseUserProfile" bp ON bp.user_id = u.user_id
     WHERE vs.id = $1`,
    [submissionId]
  );

  if (submissionResult.rows.length === 0) {
    throw new UserNotFoundError('Submission not found');
  }

  const submission = submissionResult.rows[0];

  const docsResult = await db.query(
    `SELECT id, document_type, document_number, file_name, mime_type, file_size_bytes, file_path,
            uploaded_at, verification_status, rejection_reason, reviewed_at
     FROM "UserIdentityDocument"
     WHERE submission_id = $1
     ORDER BY uploaded_at DESC`,
    [submissionId]
  );

  const displayName =
    [submission.first_name, submission.last_name].filter(Boolean).join(' ').trim() ||
    submission.contact_email ||
    submission.contact_phone ||
    submission.user_id;

  return {
    submissionId: submission.id,
    userId: submission.user_id,
    userEmail: submission.contact_email,
    userPhone: submission.contact_phone,
    userRole: submission.role,
    displayName,
    firstName: submission.first_name || null,
    lastName: submission.last_name || null,
    fullNameBn: submission.full_name_bn || null,
    dateOfBirth: submission.date_of_birth ? new Date(submission.date_of_birth).toISOString().split('T')[0] : null,
    gender: submission.gender || null,
    profilePhotoUrl: await presignDocumentUrl(submission.profile_picture_path),
    status: submission.submission_status,
    submittedAt: submission.submitted_at,
    reviewedAt: submission.reviewed_at,
    rejectionReason:
      submission.submission_status === 'REJECTED' ? submission.rejection_reason : undefined,
    documents: await Promise.all(docsResult.rows.map(async (doc: any) => ({
      documentId: doc.id,
      documentType: doc.document_type,
      documentNumber: doc.document_number,
      fileName: doc.file_name,
      mimeType: doc.mime_type,
      fileSizeBytes: doc.file_size_bytes,
      uploadedAt: doc.uploaded_at,
      verificationStatus: doc.verification_status,
      reviewedAt: doc.reviewed_at,
      rejectionReason: doc.verification_status === 'REJECTED' ? doc.rejection_reason : undefined,
      filePath: doc.file_path || null,
      signedUrl: await presignDocumentUrl(doc.file_path),
    }))),
  };
}

export async function reviewKycSubmission(
  submissionId: string,
  decision: 'APPROVED' | 'REJECTED',
  rejectionReason: string | undefined,
  adminId: string
) {
  if (decision === 'REJECTED' && !rejectionReason) {
    throw new AppError(400, 'Rejection reason is required');
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const submissionResult = await client.query(
      `SELECT user_id FROM "VerificationSubmission" WHERE id = $1`,
      [submissionId]
    );

    if (submissionResult.rows.length === 0) {
      throw new UserNotFoundError('Submission not found');
    }

    const userId = submissionResult.rows[0].user_id;

    const newStatus = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    await client.query(
      `UPDATE "VerificationSubmission"
       SET submission_status = $1, reviewed_at = NOW(), reviewed_by = $2, 
           rejection_reason = $3, updated_at = NOW()
       WHERE id = $4`,
      [newStatus, adminId, decision === 'REJECTED' ? rejectionReason || null : null, submissionId]
    );

    if (decision === 'APPROVED') {
      await client.query(
        `UPDATE "UserIdentityDocument"
         SET verification_status = 'APPROVED', rejection_reason = NULL, reviewed_at = NOW(), reviewed_by = $1
         WHERE submission_id = $2`,
        [adminId, submissionId]
      );

      await client.query(
        `UPDATE "User"
         SET kyc_verification_status = 'APPROVED', onboarding_status = 'COMPLETED', updated_at = NOW()
         WHERE user_id = $1`,
        [userId]
      );
    } else {
      await client.query(
        `UPDATE "User"
         SET kyc_verification_status = 'REJECTED', updated_at = NOW()
         WHERE user_id = $1`,
        [userId]
      );
    }

    await client.query('COMMIT');

    const userResult = await db.query(
      `SELECT kyc_verification_status, onboarding_status FROM "User" WHERE user_id = $1`,
      [userId]
    );

    const user = userResult.rows[0];

    return {
      submissionId,
      userId,
      status: newStatus,
      reviewedAt: new Date(),
      userKycStatus: user.kyc_verification_status,
      userOnboardingStatus: user.onboarding_status,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

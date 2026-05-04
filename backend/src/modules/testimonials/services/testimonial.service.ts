import { db } from '@/db/client';
import { AppError } from '@/errors/base';
import type { TestimonialStatus } from '@prisma/client';
import type { CreateTestimonialInput, GetTestimonialsQueryInput } from '../schemas';

function createId() {
  return crypto.randomUUID();
}

function sanitizeHtml(content: string) {
  // Basic HTML tag stripping to prevent XSS
  return content.replace(/<[^>]*>?/gm, '');
}

function checkPii(content: string) {
  // Regex for basic Credit Card (16 digits) and IBAN detection
  const ccRegex = /\b(?:\d[ -]*?){13,16}\b/;
  const ibanRegex = /[a-zA-Z]{2}[0-9]{2}[a-zA-Z0-9]{4}[0-9]{7}([a-zA-Z0-9]?){0,16}/;
  return ccRegex.test(content) || ibanRegex.test(content);
}

function mapTestimonial(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    rating: Number(row.rating),
    isFeatured: Boolean(row.is_featured),
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
    user: row.first_name ? {
      displayName: `${row.first_name} ${row.last_name || ''}`.trim(),
      avatarUrl: row.profile_picture_path,
      isActive: row.is_active,
    } : {
      displayName: 'Anonymous User',
      avatarUrl: null,
      isActive: row.is_active,
    },
  };
}

async function getFullTestimonialById(id: string) {
  const result = await db.query(
    `SELECT t.*, b.first_name, b.last_name, b.profile_picture_path, u.is_active
     FROM "Testimonial" t
     LEFT JOIN "BaseUserProfile" b ON t.user_id = b.user_id
     LEFT JOIN "User" u ON t.user_id = u.user_id
     WHERE t.id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;
  return mapTestimonial(result.rows[0]);
}

export async function listApprovedTestimonials(query: GetTestimonialsQueryInput) {
  const { page = 1, limit = 20 } = query;
  
  const take = limit;
  const skip = (page - 1) * limit;

  // Query logic filtering for status = 'APPROVED'
  const result = await db.query(
    `SELECT t.*, b.first_name, b.last_name, b.profile_picture_path 
     FROM "Testimonial" t
     LEFT JOIN "BaseUserProfile" b ON t.user_id = b.user_id
     WHERE t.status = 'APPROVED' 
     ORDER BY t.is_featured DESC, t.created_at DESC
     LIMIT $1 OFFSET $2`,
    [take, skip]
  );

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total 
     FROM "Testimonial" 
     WHERE status = 'APPROVED'`
  );

  const total = countResult.rows[0]?.total ?? 0;

  return {
    items: result.rows.map(mapTestimonial),
    pagination: {
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    }
  };
}

export async function submitTestimonial(userId: string, input: CreateTestimonialInput) {
  // 1. Anti-Fraud & User Verification
  const userResult = await db.query(
    `SELECT is_active, kyc_verification_status FROM "User" WHERE user_id = $1`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(404, 'User not found');
  }

  const user = userResult.rows[0];

  if (!user.is_active || user.kyc_verification_status !== 'APPROVED') {
    throw new AppError(403, 'Only active and KYC verified users can submit a testimonial');
  }

  // 2. Sanitization & PII Check
  const sanitizedContent = sanitizeHtml(input.content);
  const hasPii = checkPii(sanitizedContent);
  
  // Logic: FLAGGED if PII, otherwise PENDING (default)
  const status = hasPii ? 'FLAGGED' : 'PENDING';

  // 3. Upsert Logic
  const existingResult = await db.query(
    `SELECT id FROM "Testimonial" WHERE user_id = $1`,
    [userId]
  );

  if (existingResult.rows.length > 0) {
    const existingId = existingResult.rows[0].id;
    await db.query(
      `UPDATE "Testimonial" 
       SET content = $1, rating = $2, status = $3, updated_at = NOW() 
       WHERE id = $4 
       RETURNING id`,
      [sanitizedContent, input.rating, status, existingId]
    );
    const updated = await getFullTestimonialById(existingId);
    return { data: updated, isUpsert: true };
  } else {
    const id = createId();
    await db.query(
      `INSERT INTO "Testimonial" (
        id, user_id, content, rating, is_featured, status
      ) VALUES (
        $1, $2, $3, $4, false, $5
      )`,
      [
        id,
        userId,
        sanitizedContent,
        input.rating,
        status
      ]
    );
    const created = await getFullTestimonialById(id);
    return { data: created, isUpsert: false };
  }
}

export async function listAllTestimonialsAdmin() {
  const result = await db.query(
    `SELECT t.*, b.first_name, b.last_name, b.profile_picture_path, u.is_active
     FROM "Testimonial" t
     LEFT JOIN "BaseUserProfile" b ON t.user_id = b.user_id
     LEFT JOIN "User" u ON t.user_id = u.user_id
     ORDER BY t.created_at DESC`
  );
  return result.rows.map(mapTestimonial);
}

export async function updateTestimonialStatus(id: string, status: TestimonialStatus) {
  const result = await db.query(
    `UPDATE "Testimonial" 
     SET status = $1, updated_at = NOW() 
     WHERE id = $2`,
    [status, id]
  );

  const updated = await getFullTestimonialById(id);
  if (!updated) {
    throw new AppError(404, 'Testimonial not found');
  }

  return updated;
}

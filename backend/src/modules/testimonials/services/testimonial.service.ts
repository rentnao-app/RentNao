import { db } from '@/db/client';
import { AppError } from '@/errors/base';
import { storage } from '@/db/s3';
import type { TestimonialStatus } from '@prisma/client';
import type { CreateTestimonialInput, GetTestimonialsQueryInput } from '../schemas';

function createId() {
  return crypto.randomUUID();
}

function sanitizeHtml(content: string) {
  // Basic HTML tag stripping to prevent XSS
  return content.replace(/<[^>]*>?/gm, '');
}

async function presignProfilePhoto(key: string | null | undefined): Promise<string | null> {
  if (!key) return null;
  try {
    return await storage.presignDownload(key, 3600);
  } catch {
    return null;
  }
}

async function buildTestimonialRow(row: any) {
  const displayName = row.first_name
    ? `${row.first_name} ${row.last_name || ''}`.trim()
    : row.contact_phone || 'Anonymous User';

  const avatarUrl = await presignProfilePhoto(row.profile_picture_path);

  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    rating: Number(row.rating),
    isFeatured: Boolean(row.is_featured),
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
    user: {
      displayName,
      avatarUrl,
      isActive: Boolean(row.is_active),
    },
  };
}

async function getFullTestimonialById(id: string) {
  const result = await db.query(
    `SELECT t.*, b.first_name, b.last_name, b.profile_picture_path, u.is_active, u.contact_phone
     FROM "Testimonial" t
     LEFT JOIN "BaseUserProfile" b ON t.user_id = b.user_id
     LEFT JOIN "User" u ON t.user_id = u.user_id
     WHERE t.id = $1`,
    [id]
  );

  if (result.rows.length === 0) return null;
  return buildTestimonialRow(result.rows[0]);
}

export async function hasUserSubmittedTestimonial(userId: string): Promise<boolean> {
  const result = await db.query(`SELECT 1 FROM "Testimonial" WHERE user_id = $1 LIMIT 1`, [userId]);
  return result.rows.length > 0;
}

export async function listApprovedTestimonials(query: GetTestimonialsQueryInput) {
  const { page = 1, limit = 20 } = query;

  const take = limit;
  const skip = (page - 1) * limit;

  const result = await db.query(
    `SELECT t.*, b.first_name, b.last_name, b.profile_picture_path, u.is_active, u.contact_phone
     FROM "Testimonial" t
     LEFT JOIN "BaseUserProfile" b ON t.user_id = b.user_id
     LEFT JOIN "User" u ON t.user_id = u.user_id
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

  const items = await Promise.all(result.rows.map((row) => buildTestimonialRow(row)));

  return {
    items,
    pagination: {
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

export async function submitTestimonial(
  userId: string,
  input: CreateTestimonialInput
): Promise<{ data: any; isUpsert: boolean }> {
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

  const sanitizedContent = sanitizeHtml(input.content);
  const status = 'APPROVED' as const;

  const existingResult = await db.query(`SELECT id FROM "Testimonial" WHERE user_id = $1`, [userId]);

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
    if (!updated) throw new AppError(500, 'Failed to retrieve updated testimonial');
    return { data: updated, isUpsert: true };
  }

  const id = createId();
  await db.query(
    `INSERT INTO "Testimonial" (
        id, user_id, content, rating, is_featured, status
      ) VALUES (
        $1, $2, $3, $4, false, $5
      )`,
    [id, userId, sanitizedContent, input.rating, status]
  );
  const created = await getFullTestimonialById(id);
  if (!created) throw new AppError(500, 'Failed to retrieve created testimonial');
  return { data: created, isUpsert: false };
}

export async function listAllTestimonialsAdmin() {
  const result = await db.query(
    `SELECT t.*, b.first_name, b.last_name, b.profile_picture_path, u.is_active, u.contact_phone
     FROM "Testimonial" t
     LEFT JOIN "BaseUserProfile" b ON t.user_id = b.user_id
     LEFT JOIN "User" u ON t.user_id = u.user_id
     ORDER BY t.created_at DESC`
  );
  return Promise.all(result.rows.map((row) => buildTestimonialRow(row)));
}

export async function updateTestimonialStatus(id: string, status: TestimonialStatus) {
  await db.query(
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

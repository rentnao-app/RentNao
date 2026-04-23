import { db } from '@/db/client';
import { storage } from '@/db/s3';
import { AppError } from '@/errors/base';

async function presignImageUrl(storagePath: string | null | undefined): Promise<string | null> {
  if (!storagePath) return null;
  try {
    return await storage.presignDownload(storagePath, 3600);
  } catch {
    return null;
  }
}

async function getTenantIdForUser(userId: string): Promise<string> {
  const r = await db.query(`SELECT tenant_id FROM "TenantProfile" WHERE user_id = $1 LIMIT 1`, [userId]);
  if (r.rows.length === 0) {
    throw new AppError(403, 'Tenant profile required for wishlist');
  }
  return r.rows[0].tenant_id as string;
}

export type WishlistItem = {
  listingId: string;
  propertyId: string;
  title: string | null;
  rent: number;
  areaName: string | null;
  roomCount: number | null;
  bathroomCount: number | null;
  propertySizeSqft: number | null;
  listingStatus: string;
  primaryImageUrl: string | null;
  addedAt: string;
};

export async function listWishlistForTenant(userId: string, role: string): Promise<WishlistItem[]> {
  if (role !== 'TENANT') {
    throw new AppError(403, 'Only tenants can access wishlist');
  }
  const tenantId = await getTenantIdForUser(userId);

  const result = await db.query(
    `SELECT
      w.listing_id,
      w.added_at,
      l.property_id,
      l.rent,
      l.listing_status,
      p.title,
      p.area_name,
      p.room_count,
      p.bathroom_count,
      p.property_size_sqft,
      pi.storage_path AS primary_image_path
     FROM "Wishlist" w
     JOIN "Listing" l ON l.listing_id = w.listing_id
     JOIN "Property" p ON p.property_id = l.property_id
     LEFT JOIN "PropertyImage" pi ON pi.property_id = p.property_id AND pi.is_primary = true
     WHERE w.tenant_id = $1
     ORDER BY w.added_at DESC`,
    [tenantId]
  );

  const items: WishlistItem[] = [];
  for (const row of result.rows) {
    items.push({
      listingId: row.listing_id,
      propertyId: row.property_id,
      title: row.title,
      rent: Number(row.rent),
      areaName: row.area_name,
      roomCount: row.room_count != null ? Number(row.room_count) : null,
      bathroomCount: row.bathroom_count != null ? Number(row.bathroom_count) : null,
      propertySizeSqft: row.property_size_sqft != null ? Number(row.property_size_sqft) : null,
      listingStatus: row.listing_status,
      primaryImageUrl: await presignImageUrl(row.primary_image_path),
      addedAt: row.added_at.toISOString(),
    });
  }
  return items;
}

export async function addListingToWishlist(userId: string, role: string, listingId: string): Promise<void> {
  if (role !== 'TENANT') {
    throw new AppError(403, 'Only tenants can save listings');
  }
  const tenantId = await getTenantIdForUser(userId);

  const listingCheck = await db.query(
    `SELECT listing_id FROM "Listing" WHERE listing_id = $1 AND listing_status = 'ACTIVE' LIMIT 1`,
    [listingId]
  );
  if (listingCheck.rows.length === 0) {
    throw new AppError(404, 'Active listing not found');
  }

  await db.query(
    `INSERT INTO "Wishlist" (tenant_id, listing_id) VALUES ($1, $2)
     ON CONFLICT (tenant_id, listing_id) DO NOTHING`,
    [tenantId, listingId]
  );
}

export async function removeListingFromWishlist(userId: string, role: string, listingId: string): Promise<void> {
  if (role !== 'TENANT') {
    throw new AppError(403, 'Only tenants can modify wishlist');
  }
  const tenantId = await getTenantIdForUser(userId);

  const del = await db.query(`DELETE FROM "Wishlist" WHERE tenant_id = $1 AND listing_id = $2`, [
    tenantId,
    listingId,
  ]);
  if (del.rowCount === 0) {
    throw new AppError(404, 'Wishlist entry not found');
  }
}

export async function isListingWishlisted(userId: string, role: string, listingId: string): Promise<boolean> {
  if (role !== 'TENANT') return false;
  try {
    const tenantId = await getTenantIdForUser(userId);
    const r = await db.query(
      `SELECT 1 FROM "Wishlist" WHERE tenant_id = $1 AND listing_id = $2 LIMIT 1`,
      [tenantId, listingId]
    );
    return r.rows.length > 0;
  } catch {
    return false;
  }
}

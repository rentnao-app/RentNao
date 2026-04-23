import crypto from 'crypto';
import { db } from '@/db/client';
import { AppError } from '@/errors/base';
import { createNotification } from '@/modules/notifications/notifications.service';

type ListingContext = {
  listing_id: string;
  listing_status: string;
  rent: string;
  property_id: string;
  title: string | null;
  area_name: string | null;
  property_type: string;
  owner_user_id: string;
};

async function getListingContext(listingId: string): Promise<ListingContext | null> {
  const r = await db.query(
    `SELECT l.listing_id, l.listing_status, l.rent::text AS rent,
            p.property_id, p.title, p.area_name::text AS area_name, p.property_type::text AS property_type,
            o.user_id AS owner_user_id
     FROM "Listing" l
     JOIN "Property" p ON p.property_id = l.property_id
     JOIN "OwnerProfile" o ON o.owner_id = p.owner_id
     WHERE l.listing_id = $1
     LIMIT 1`,
    [listingId]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    listing_id: row.listing_id as string,
    listing_status: row.listing_status as string,
    rent: row.rent as string,
    property_id: row.property_id as string,
    title: row.title as string | null,
    area_name: row.area_name as string | null,
    property_type: row.property_type as string,
    owner_user_id: row.owner_user_id as string,
  };
}

async function getOwnerUserIdForRequest(requestId: string): Promise<{ ownerUserId: string; tenantUserId: string; listingId: string; status: string } | null> {
  const r = await db.query(
    `SELECT o.user_id AS owner_user_id, rr.tenant_user_id, rr.listing_id, rr.status::text AS status
     FROM "RentalRequest" rr
     JOIN "Listing" l ON l.listing_id = rr.listing_id
     JOIN "Property" p ON p.property_id = l.property_id
     JOIN "OwnerProfile" o ON o.owner_id = p.owner_id
     WHERE rr.rental_request_id = $1
     LIMIT 1`,
    [requestId]
  );
  if (r.rows.length === 0) return null;
  const row = r.rows[0];
  return {
    ownerUserId: row.owner_user_id as string,
    tenantUserId: row.tenant_user_id as string,
    listingId: row.listing_id as string,
    status: row.status as string,
  };
}

function mapRequestRow(row: Record<string, unknown>, tenantBlock?: Record<string, unknown>) {
  const listing = {
    listing_id: row.listing_id as string,
    rent: row.rent as string,
    property: {
      property_id: row.property_id as string,
      property_type: row.property_type as string,
      area_name: row.area_name as string | null,
      title: row.title as string | null,
    },
  };
  const tenantUser = tenantBlock ?? {
    user_id: row.tenant_user_id as string,
    email: row.contact_email as string | null,
    username: row.username_display as string | null,
  };
  const tenantProfile =
    row.tenant_family_status != null
      ? { tenant_category: String(row.tenant_family_status) }
      : undefined;

  return {
    request_id: row.rental_request_id as string,
    request_status: String(row.status).toLowerCase(),
    requested_at: (row.created_at as Date).toISOString(),
    message: row.message as string | null,
    listing,
    tenant: tenantProfile,
    user: tenantUser,
    rental: null as null,
  };
}

export async function createRentalRequest(
  tenantUserId: string,
  role: string,
  listingId: string,
  message: string | undefined
): Promise<{ request_id: string }> {
  if (role !== 'TENANT') {
    throw new AppError(403, 'Only tenants can send rental requests');
  }

  const ctx = await getListingContext(listingId);
  if (!ctx) {
    throw new AppError(404, 'Listing not found');
  }
  if (ctx.listing_status !== 'ACTIVE') {
    throw new AppError(400, 'This listing is not accepting requests');
  }
  if (ctx.owner_user_id === tenantUserId) {
    throw new AppError(400, 'You cannot request your own listing');
  }

  const dup = await db.query(
    `SELECT rental_request_id FROM "RentalRequest"
     WHERE listing_id = $1 AND tenant_user_id = $2 AND status = 'PENDING' LIMIT 1`,
    [listingId, tenantUserId]
  );
  if (dup.rows.length > 0) {
    throw new AppError(409, 'You already have a pending request for this listing');
  }

  const requestId = crypto.randomUUID();
  await db.query(
    `INSERT INTO "RentalRequest" (rental_request_id, listing_id, tenant_user_id, status, message)
     VALUES ($1, $2, $3, 'PENDING', $4)`,
    [requestId, listingId, tenantUserId, message?.trim() || null]
  );

  const preview = ctx.title || `${ctx.property_type} in ${ctx.area_name || 'your area'}`;
  await createNotification(ctx.owner_user_id, 'New rental request', `A tenant requested to rent: ${preview}.`, {
    listing_id: listingId,
    rental_request_id: requestId,
    url: `/owner-dashboard/requests`,
  });
  await createNotification(tenantUserId, 'Request sent', `Your rental request for "${preview}" was sent to the owner.`, {
    listing_id: listingId,
    rental_request_id: requestId,
    url: `/tenant-dashboard/applications`,
  });

  return { request_id: requestId };
}

export async function listMyRentalRequests(tenantUserId: string, role: string) {
  if (role !== 'TENANT') {
    throw new AppError(403, 'Only tenants can view their requests');
  }

  const r = await db.query(
    `SELECT rr.rental_request_id, rr.status, rr.message, rr.created_at,
            rr.tenant_user_id,
            l.listing_id, l.rent::text AS rent,
            p.property_id, p.title, p.area_name::text AS area_name, p.property_type::text AS property_type,
            u.contact_email,
            COALESCE(NULLIF(TRIM(CONCAT(COALESCE(bp.first_name, ''), ' ', COALESCE(bp.last_name, ''))), ''), u.contact_email) AS username_display,
            tp.family_status::text AS tenant_family_status
     FROM "RentalRequest" rr
     JOIN "Listing" l ON l.listing_id = rr.listing_id
     JOIN "Property" p ON p.property_id = l.property_id
     JOIN "User" u ON u.user_id = rr.tenant_user_id
     LEFT JOIN "BaseUserProfile" bp ON bp.user_id = rr.tenant_user_id
     LEFT JOIN "TenantProfile" tp ON tp.user_id = rr.tenant_user_id
     WHERE rr.tenant_user_id = $1
     ORDER BY rr.created_at DESC`,
    [tenantUserId]
  );

  return r.rows.map((row) => mapRequestRow(row));
}

export async function listIncomingForOwner(ownerUserId: string, role: string) {
  if (role !== 'OWNER') {
    throw new AppError(403, 'Only owners can view incoming requests');
  }

  const r = await db.query(
    `SELECT rr.rental_request_id, rr.status, rr.message, rr.created_at,
            rr.tenant_user_id,
            l.listing_id, l.rent::text AS rent,
            p.property_id, p.title, p.area_name::text AS area_name, p.property_type::text AS property_type,
            u.contact_email,
            COALESCE(NULLIF(TRIM(CONCAT(COALESCE(bp.first_name, ''), ' ', COALESCE(bp.last_name, ''))), ''), u.contact_email) AS username_display,
            tp.family_status::text AS tenant_family_status
     FROM "RentalRequest" rr
     JOIN "Listing" l ON l.listing_id = rr.listing_id
     JOIN "Property" p ON p.property_id = l.property_id
     JOIN "OwnerProfile" o ON o.owner_id = p.owner_id AND o.user_id = $1
     JOIN "User" u ON u.user_id = rr.tenant_user_id
     LEFT JOIN "BaseUserProfile" bp ON bp.user_id = rr.tenant_user_id
     LEFT JOIN "TenantProfile" tp ON tp.user_id = rr.tenant_user_id
     ORDER BY rr.created_at DESC`,
    [ownerUserId]
  );

  return r.rows.map((row) =>
    mapRequestRow(row, {
      user_id: row.tenant_user_id as string,
      email: row.contact_email as string | null,
      username: row.username_display as string | null,
    })
  );
}

export async function myRequestStatusForListing(tenantUserId: string, role: string, listingId: string) {
  if (role !== 'TENANT') {
    return { hasPending: false, status: null as string | null };
  }
  const r = await db.query(
    `SELECT status::text AS status FROM "RentalRequest"
     WHERE listing_id = $1 AND tenant_user_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [listingId, tenantUserId]
  );
  if (r.rows.length === 0) {
    return { hasPending: false, status: null };
  }
  const status = r.rows[0].status as string;
  return { hasPending: status === 'PENDING', status: status.toLowerCase() };
}

export async function withdrawRentalRequest(tenantUserId: string, role: string, requestId: string): Promise<void> {
  if (role !== 'TENANT') {
    throw new AppError(403, 'Only tenants can cancel a request');
  }
  const r = await db.query(
    `UPDATE "RentalRequest" SET status = 'CANCELLED', updated_at = NOW()
     WHERE rental_request_id = $1 AND tenant_user_id = $2 AND status = 'PENDING'
     RETURNING listing_id`,
    [requestId, tenantUserId]
  );
  if (r.rows.length === 0) {
    throw new AppError(404, 'Pending request not found');
  }
  const listingId = r.rows[0].listing_id as string;
  const meta = await getOwnerUserIdForRequest(requestId);
  if (meta) {
    await createNotification(meta.ownerUserId, 'Rental request cancelled', 'A tenant cancelled their rental request for your listing.', {
      listing_id: listingId,
      rental_request_id: requestId,
      url: `/owner-dashboard/requests`,
    });
  }
  await createNotification(tenantUserId, 'Request cancelled', 'You cancelled your rental request.', {
    listing_id: listingId,
    rental_request_id: requestId,
    url: `/tenant-dashboard/applications`,
  });
}

export async function acceptRentalRequest(ownerUserId: string, role: string, requestId: string): Promise<void> {
  if (role !== 'OWNER') {
    throw new AppError(403, 'Only owners can approve requests');
  }
  const meta = await getOwnerUserIdForRequest(requestId);
  if (!meta || meta.ownerUserId !== ownerUserId) {
    throw new AppError(404, 'Request not found');
  }
  if (meta.status !== 'PENDING') {
    throw new AppError(400, 'Request is no longer pending');
  }
  await db.query(
    `UPDATE "RentalRequest" SET status = 'APPROVED', updated_at = NOW()
     WHERE rental_request_id = $1 AND status = 'PENDING'`,
    [requestId]
  );
  await createNotification(meta.tenantUserId, 'Request approved', 'The owner approved your rental request.', {
    listing_id: meta.listingId,
    rental_request_id: requestId,
    url: `/listings/${meta.listingId}`,
  });
}

export async function rejectRentalRequest(ownerUserId: string, role: string, requestId: string): Promise<void> {
  if (role !== 'OWNER') {
    throw new AppError(403, 'Only owners can reject requests');
  }
  const meta = await getOwnerUserIdForRequest(requestId);
  if (!meta || meta.ownerUserId !== ownerUserId) {
    throw new AppError(404, 'Request not found');
  }
  if (meta.status !== 'PENDING') {
    throw new AppError(400, 'Request is no longer pending');
  }
  await db.query(
    `UPDATE "RentalRequest" SET status = 'REJECTED', updated_at = NOW()
     WHERE rental_request_id = $1 AND status = 'PENDING'`,
    [requestId]
  );
  await createNotification(meta.tenantUserId, 'Request declined', 'The owner declined your rental request.', {
    listing_id: meta.listingId,
    rental_request_id: requestId,
    url: `/tenant-dashboard/applications`,
  });
}

export async function deleteRentalRequestByOwner(ownerUserId: string, role: string, requestId: string): Promise<void> {
  if (role !== 'OWNER') {
    throw new AppError(403, 'Only owners can remove requests');
  }
  const meta = await getOwnerUserIdForRequest(requestId);
  if (!meta || meta.ownerUserId !== ownerUserId) {
    throw new AppError(404, 'Request not found');
  }
  await db.query(`DELETE FROM "RentalRequest" WHERE rental_request_id = $1`, [requestId]);
  await createNotification(
    meta.tenantUserId,
    'Request removed',
    'The owner removed your rental request from their dashboard.',
    {
      listing_id: meta.listingId,
      url: `/tenant-dashboard/applications`,
    }
  );
}

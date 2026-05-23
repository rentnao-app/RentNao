import { db } from '@/db/client';
import { storage } from '@/db/s3';
import { AppError } from '@/errors/base';
import { assertPaidActionAndDebit } from '@/modules/wallet/services';
import { createConversationOnUnlock } from '@/modules/conversations';
import type {
  AdminListingsQueryInput,
  CreatePropertyImageInput,
  CreateListingInput,
  CreatePropertyInput,
  PublicListingsQueryInput,
  PropertyImageUploadUrlRequestInput,
  UpdatePropertyInput,
  UpdateListingStatusInput,
} from '../schemas';

function createId() {
  return crypto.randomUUID();
}

function toNumberOrNull(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return Number(value);
}

function mapProperty(row: any) {
  return {
    propertyId: row.property_id,
    ownerId: row.owner_id,
    propertyType: row.property_type,
    propertySizeSqft: toNumberOrNull(row.property_size_sqft),
    roomCount: toNumberOrNull(row.room_count),
    bathroomCount: toNumberOrNull(row.bathroom_count),
    balconyCount: row.balcony_count === null || row.balcony_count === undefined ? null : Number(row.balcony_count),
    areaName: row.area_name,
    exactLat: row.exact_lat,
    exactLng: row.exact_lng,
    title: row.title,
    description: row.description,
    address: row.address,
    buildingFloors: row.building_floors === null || row.building_floors === undefined ? null : Number(row.building_floors),
    buildingFacing: row.building_facing,
    hasLift: row.has_lift,
    hasGenerator: row.has_generator,
    hasSecurityGuard: row.has_security_guard,
    intendedTenantType: row.intended_tenant_type,
    createdAt: row.created_at.toISOString(),
  };
}

function mapPropertyImage(row: any) {
  return {
    imageId: row.image_id,
    propertyId: row.property_id,
    storagePath: row.storage_path,
    fileName: row.file_name,
    fileSize: row.file_size === null || row.file_size === undefined ? null : Number(row.file_size),
    mimeType: row.mime_type,
    displayOrder: Number(row.display_order),
    isPrimary: Boolean(row.is_primary),
    altText: row.alt_text,
    uploadedAt: row.uploaded_at.toISOString(),
  };
}

async function mapPropertyImageWithUrl(row: any) {
  const mapped = mapPropertyImage(row);
  return {
    ...mapped,
    url: await presignImageUrl(row.storage_path),
  };
}

function mapListing(row: any) {
  return {
    listingId: row.listing_id,
    propertyId: row.property_id,
    rent: Number(row.rent),
    listingStartDate: row.listing_start_date.toISOString(),
    listingEndDate: row.listing_end_date ? row.listing_end_date.toISOString() : null,
    listingStatus: row.listing_status,
    viewCount: Number(row.view_count),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at ? row.updated_at.toISOString() : null,
  };
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function presignImageUrl(storagePath: string | null | undefined): Promise<string | null> {
  if (!storagePath) return null;
  try {
    return await storage.presignDownload(storagePath, 3600);
  } catch {
    return null;
  }
}

async function getOwnerIdByUserId(userId: string): Promise<string> {
  const result = await db.query(
    `SELECT owner_id FROM "OwnerProfile" WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Owner profile not found. Complete owner onboarding first.');
  }

  return result.rows[0].owner_id;
}

async function assertTenantActor(userId: string, role: string): Promise<void> {
  if (role !== 'TENANT') {
    throw new AppError(403, 'Only tenants can perform this action');
  }

  const tenantResult = await db.query(
    `SELECT tenant_id FROM "TenantProfile" WHERE user_id = $1`,
    [userId]
  );

  if (tenantResult.rows.length === 0) {
    throw new AppError(403, 'Tenant profile not found');
  }
}

async function getPropertyByIdForActor(userId: string, role: string, propertyId: string) {
  if (role === 'ADMIN') {
    const adminResult = await db.query(
      `SELECT * FROM "Property" WHERE property_id = $1`,
      [propertyId]
    );

    if (adminResult.rows.length === 0) {
      throw new AppError(404, 'Property not found');
    }

    return adminResult.rows[0];
  }

  if (role !== 'OWNER') {
    throw new AppError(403, 'Insufficient permissions');
  }

  const ownerId = await getOwnerIdByUserId(userId);
  const ownerResult = await db.query(
    `SELECT * FROM "Property" WHERE property_id = $1 AND owner_id = $2`,
    [propertyId, ownerId]
  );

  if (ownerResult.rows.length === 0) {
    throw new AppError(404, 'Property not found');
  }

  return ownerResult.rows[0];
}

export async function listPropertiesByOwnerUserId(ownerUserId: string) {
  const ownerId = await getOwnerIdByUserId(ownerUserId);

  const result = await db.query(
    `SELECT *
     FROM "Property"
     WHERE owner_id = $1
     ORDER BY created_at DESC`,
    [ownerId]
  );

  const items = result.rows.map(mapProperty);
  return { items, total: items.length };
}

export async function createProperty(userId: string, input: CreatePropertyInput) {
  const ownerId = await getOwnerIdByUserId(userId);
  const propertyId = createId();

  const result = await db.query(
    `INSERT INTO "Property" (
      property_id,
      owner_id,
      property_size_sqft,
      room_count,
      bathroom_count,
      balcony_count,
      area_name,
      exact_lat,
      exact_lng,
      title,
      description,
      address,
      building_floors,
      building_facing,
      has_lift,
      has_generator,
      has_security_guard,
      intended_tenant_type
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9,
      $10, $11, $12, $13, $14, $15, $16, $17, $18
    )
    RETURNING *`,
    [
      propertyId,
      ownerId,
      input.propertySizeSqft,
      input.roomCount,
      input.bathroomCount,
      input.balconyCount,
      input.areaName,
      input.exactLat,
      input.exactLng,
      input.title,
      input.description,
      input.address,
      input.buildingFloors,
      input.buildingFacing,
      input.hasLift,
      input.hasGenerator,
      input.hasSecurityGuard,
      input.intendedTenantType,
    ]
  );

  return mapProperty(result.rows[0]);
}

export async function listMyProperties(userId: string) {
  const ownerId = await getOwnerIdByUserId(userId);

  const result = await db.query(
    `SELECT *
     FROM "Property"
     WHERE owner_id = $1
     ORDER BY created_at DESC`,
    [ownerId]
  );

  const items = result.rows.map(mapProperty);
  return { items, total: items.length };
}

export async function getMyPropertyById(userId: string, propertyId: string) {
  const row = await getPropertyByIdForActor(userId, 'OWNER', propertyId);
  return mapProperty(row);
}

export async function getPropertyByIdForUserRole(userId: string, role: string, propertyId: string) {
  const row = await getPropertyByIdForActor(userId, role, propertyId);
  return mapProperty(row);
}

export async function updateMyPropertyById(userId: string, propertyId: string, input: UpdatePropertyInput) {
  const ownerId = await getOwnerIdByUserId(userId);

  const updates: string[] = [];
  const values: any[] = [];

  const addUpdate = (column: string, value: any) => {
    values.push(value);
    updates.push(`${column} = $${values.length}`);
  };

  if (input.title !== undefined) addUpdate('title', input.title);
  if (input.description !== undefined) addUpdate('description', input.description);
  if (input.address !== undefined) addUpdate('address', input.address);
  if (input.propertySizeSqft !== undefined) addUpdate('property_size_sqft', input.propertySizeSqft);
  if (input.roomCount !== undefined) addUpdate('room_count', input.roomCount);
  if (input.bathroomCount !== undefined) addUpdate('bathroom_count', input.bathroomCount);
  if (input.balconyCount !== undefined) addUpdate('balcony_count', input.balconyCount);
  if (input.areaName !== undefined) addUpdate('area_name', input.areaName);
  if (input.exactLat !== undefined) addUpdate('exact_lat', input.exactLat);
  if (input.exactLng !== undefined) addUpdate('exact_lng', input.exactLng);
  if (input.buildingFloors !== undefined) addUpdate('building_floors', input.buildingFloors);
  if (input.buildingFacing !== undefined) addUpdate('building_facing', input.buildingFacing);
  if (input.hasLift !== undefined) addUpdate('has_lift', input.hasLift);
  if (input.hasGenerator !== undefined) addUpdate('has_generator', input.hasGenerator);
  if (input.hasSecurityGuard !== undefined) addUpdate('has_security_guard', input.hasSecurityGuard);
  if (input.intendedTenantType !== undefined) addUpdate('intended_tenant_type', input.intendedTenantType);

  if (updates.length === 0) {
    throw new AppError(400, 'No fields provided for update');
  }

  values.push(propertyId);
  values.push(ownerId);

  const result = await db.query(
    `UPDATE "Property"
     SET ${updates.join(', ')}
     WHERE property_id = $${values.length - 1} AND owner_id = $${values.length}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Property not found');
  }

  return mapProperty(result.rows[0]);
}

export async function createListingForProperty(
  actorUserId: string,
  actorRole: string,
  propertyId: string,
  input: CreateListingInput
) {
  if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') {
    throw new AppError(403, 'Only owners or admins can create listings');
  }

  const property = await getPropertyByIdForActor(actorUserId, actorRole, propertyId);

  const ownerUserResult = await db.query(
    `SELECT user_id FROM "OwnerProfile" WHERE owner_id = $1`,
    [property.owner_id]
  );

  if (ownerUserResult.rows.length === 0) {
    throw new AppError(404, 'Owner profile not found for this property');
  }

  const ownerUserId = ownerUserResult.rows[0].user_id as string;
  const listingId = createId();

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const activeListingResult = await client.query(
      `SELECT listing_id
       FROM "Listing"
       WHERE property_id = $1
         AND listing_status = 'ACTIVE'
       LIMIT 1`,
      [propertyId]
    );

    if (activeListingResult.rows.length > 0) {
      throw new AppError(409, 'This property already has an active listing');
    }

    if (actorRole === 'OWNER') {
      await assertPaidActionAndDebit(client, {
        userId: ownerUserId,
        feeCode: 'LISTING_CREATE',
        referenceType: 'LISTING',
        referenceId: listingId,
        walletTxnType: 'LISTING_FEE',
        description: `Listing creation fee for property ${propertyId}`,
        referenceData: {
          rent: Number(input.rent),
        },
      });
    }

    const listingResult = await client.query(
      `INSERT INTO "Listing" (
        listing_id,
        property_id,
        rent,
        listing_start_date,
        listing_end_date,
        listing_status
      ) VALUES (
        $1, $2, $3, $4::timestamptz, $5::timestamptz, 'ACTIVE'
      )
      RETURNING *`,
      [
        listingId,
        propertyId,
        input.rent,
        input.listingStartDate,
        input.listingEndDate || null,
      ]
    );

    await client.query('COMMIT');
    return mapListing(listingResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listListingsByPropertyForUserRole(
  actorUserId: string,
  actorRole: string,
  propertyId: string
) {
  if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') {
    throw new AppError(403, 'Only owners or admins can access property listings');
  }

  await getPropertyByIdForActor(actorUserId, actorRole, propertyId);

  const result = await db.query(
    `SELECT *
     FROM "Listing"
     WHERE property_id = $1
     ORDER BY created_at DESC`,
    [propertyId]
  );

  const items = result.rows.map(mapListing);
  return { items, total: items.length };
}

export async function updateMyListingStatus(
  actorUserId: string,
  actorRole: string,
  propertyId: string,
  listingId: string,
  input: UpdateListingStatusInput
) {
  await getPropertyByIdForActor(actorUserId, actorRole, propertyId);

  const found = await db.query(
    `SELECT listing_id, property_id, listing_status FROM "Listing" WHERE listing_id = $1 AND property_id = $2`,
    [listingId, propertyId]
  );
  if (found.rows.length === 0) {
    throw new AppError(404, 'Listing not found');
  }

  const current = String(found.rows[0].listing_status);
  const next = input.listingStatus;

  if (next === 'UNLISTED') {
    if (current !== 'ACTIVE' && current !== 'PENDING_PAYMENT') {
      throw new AppError(400, 'Only active or pending-payment listings can be paused');
    }
    await db.query(`UPDATE "Listing" SET listing_status = 'UNLISTED', updated_at = NOW() WHERE listing_id = $1`, [
      listingId,
    ]);
  } else if (next === 'ACTIVE') {
    if (current !== 'UNLISTED') {
      throw new AppError(400, 'Only paused (unlisted) listings can be resumed here');
    }
    const activeOther = await db.query(
      `SELECT listing_id FROM "Listing" WHERE property_id = $1 AND listing_status = 'ACTIVE' AND listing_id <> $2 LIMIT 1`,
      [propertyId, listingId]
    );
    if (activeOther.rows.length > 0) {
      throw new AppError(409, 'This property already has an active listing');
    }
    await db.query(`UPDATE "Listing" SET listing_status = 'ACTIVE', updated_at = NOW() WHERE listing_id = $1`, [
      listingId,
    ]);
  }

  const updated = await db.query(`SELECT * FROM "Listing" WHERE listing_id = $1`, [listingId]);
  return mapListing(updated.rows[0]);
}

export async function listPublicListings(query: PublicListingsQueryInput) {
  const {
    page = 1,
    limit = 20,
    areaName,
    minRent,
    maxRent,
    roomCount,
    minRoomCount,
    propertyCategory,
    bathroomCount,
    intendedTenantType,
    sortBy = 'createdAt',
    sortDir = 'desc',
  } = query;

  const conditions = [`l.listing_status = 'ACTIVE'`];
  const params: any[] = [];
  let idx = 1;

  const ownerJoin = `LEFT JOIN "OwnerProfile" op ON op.owner_id = p.owner_id`;

  if (areaName) {
    conditions.push(`p.area_name = $${idx++}`);
    params.push(areaName);
  }
  if (minRent !== undefined) {
    conditions.push(`l.rent >= $${idx++}`);
    params.push(minRent);
  }
  if (maxRent !== undefined) {
    conditions.push(`l.rent <= $${idx++}`);
    params.push(maxRent);
  }
  if (roomCount !== undefined && minRoomCount === undefined) {
    conditions.push(`p.room_count = $${idx++}`);
    params.push(roomCount);
  }
  if (minRoomCount !== undefined) {
    conditions.push(`p.room_count >= $${idx++}`);
    params.push(minRoomCount);
  }
  if (bathroomCount !== undefined) {
    conditions.push(`p.bathroom_count = $${idx++}`);
    params.push(bathroomCount);
  }
  if (intendedTenantType) {
    conditions.push(`p.intended_tenant_type = $${idx++}`);
    params.push(intendedTenantType);
  }
  if (propertyCategory === 'RESIDENTIAL') {
    conditions.push(`(op.owner_category = 'RESIDENTIAL' OR op.owner_category IS NULL)`);
  } else if (propertyCategory === 'COMMERCIAL') {
    conditions.push(`op.owner_category = 'COMMERCIAL'`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM "Listing" l
     JOIN "Property" p ON p.property_id = l.property_id
     ${ownerJoin}
     ${whereClause}`,
    params
  );

  const total = countResult.rows[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const sortColumnMap: Record<string, string> = {
    createdAt: 'l.created_at',
    rent: 'l.rent',
    listingStartDate: 'l.listing_start_date',
  };
  const orderColumn = sortColumnMap[sortBy] || 'l.created_at';
  const orderDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;
  params.push(limit);
  params.push(offset);

  const listResult = await db.query(
    `SELECT
      l.listing_id,
      l.property_id,
      l.rent,
      l.listing_start_date,
      l.listing_end_date,
      l.listing_status,
      l.created_at,
      p.title,
      p.description,
      p.area_name,
      p.property_size_sqft,
      p.room_count,
      p.bathroom_count,
      p.balcony_count,
      p.intended_tenant_type,
      pi.storage_path AS primary_image_path
     FROM "Listing" l
     JOIN "Property" p ON p.property_id = l.property_id
     ${ownerJoin}
     LEFT JOIN "PropertyImage" pi ON pi.property_id = p.property_id AND pi.is_primary = true
     ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT $${idx++} OFFSET $${idx++}`,
    params
  );

  const items = await Promise.all(
    listResult.rows.map(async (row: any) => ({
      listingId: row.listing_id,
      propertyId: row.property_id,
      title: row.title,
      description: row.description,
      rent: Number(row.rent),
      listingStartDate: row.listing_start_date.toISOString(),
      listingEndDate: row.listing_end_date ? row.listing_end_date.toISOString() : null,
      listingStatus: row.listing_status,
      areaName: row.area_name,
      propertySizeSqft: Number(row.property_size_sqft),
      roomCount: Number(row.room_count),
      bathroomCount: Number(row.bathroom_count),
      balconyCount: Number(row.balcony_count),
      intendedTenantType: row.intended_tenant_type,
      primaryImagePath: row.primary_image_path,
      primaryImageUrl: await presignImageUrl(row.primary_image_path),
      createdAt: row.created_at.toISOString(),
    }))
  );

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function listListingsForAdmin(query: AdminListingsQueryInput) {
  const {
    page = 1,
    limit = 20,
    listingStatus,
    areaName,
    minRent,
    maxRent,
    roomCount,
    bathroomCount,
    intendedTenantType,
    sortBy = 'createdAt',
    sortDir = 'desc',
  } = query;

  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  if (listingStatus) {
    conditions.push(`l.listing_status = $${idx++}`);
    params.push(listingStatus);
  }
  if (areaName) {
    conditions.push(`p.area_name = $${idx++}`);
    params.push(areaName);
  }
  if (minRent !== undefined) {
    conditions.push(`l.rent >= $${idx++}`);
    params.push(minRent);
  }
  if (maxRent !== undefined) {
    conditions.push(`l.rent <= $${idx++}`);
    params.push(maxRent);
  }
  if (roomCount !== undefined) {
    conditions.push(`p.room_count = $${idx++}`);
    params.push(roomCount);
  }
  if (bathroomCount !== undefined) {
    conditions.push(`p.bathroom_count = $${idx++}`);
    params.push(bathroomCount);
  }
  if (intendedTenantType) {
    conditions.push(`p.intended_tenant_type = $${idx++}`);
    params.push(intendedTenantType);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total
     FROM "Listing" l
     JOIN "Property" p ON p.property_id = l.property_id
     ${whereClause}`,
    params
  );

  const total = countResult.rows[0]?.total ?? 0;
  const totalPages = Math.ceil(total / limit);

  const sortColumnMap: Record<string, string> = {
    createdAt: 'l.created_at',
    rent: 'l.rent',
    listingStartDate: 'l.listing_start_date',
  };
  const orderColumn = sortColumnMap[sortBy] || 'l.created_at';
  const orderDirection = sortDir === 'asc' ? 'ASC' : 'DESC';

  const offset = (page - 1) * limit;
  params.push(limit);
  params.push(offset);

  const listResult = await db.query(
    `SELECT
      l.listing_id,
      l.property_id,
      l.rent,
      l.listing_start_date,
      l.listing_end_date,
      l.listing_status,
      l.created_at,
      p.title,
      p.description,
      p.area_name,
      p.property_size_sqft,
      p.room_count,
      p.bathroom_count,
      p.balcony_count,
      p.intended_tenant_type,
      pi.storage_path AS primary_image_path
     FROM "Listing" l
     JOIN "Property" p ON p.property_id = l.property_id
     LEFT JOIN "PropertyImage" pi ON pi.property_id = p.property_id AND pi.is_primary = true
     ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT $${idx++} OFFSET $${idx++}`,
    params
  );

  const items = await Promise.all(
    listResult.rows.map(async (row: any) => ({
      listingId: row.listing_id,
      propertyId: row.property_id,
      title: row.title,
      description: row.description,
      rent: Number(row.rent),
      listingStartDate: row.listing_start_date.toISOString(),
      listingEndDate: row.listing_end_date ? row.listing_end_date.toISOString() : null,
      listingStatus: row.listing_status,
      areaName: row.area_name,
      propertySizeSqft: Number(row.property_size_sqft),
      roomCount: Number(row.room_count),
      bathroomCount: Number(row.bathroom_count),
      balconyCount: Number(row.balcony_count),
      intendedTenantType: row.intended_tenant_type,
      primaryImagePath: row.primary_image_path,
      primaryImageUrl: await presignImageUrl(row.primary_image_path),
      createdAt: row.created_at.toISOString(),
    }))
  );

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getPublicListingDetail(listingId: string) {
  const result = await db.query(
    `SELECT
      l.listing_id,
      l.property_id,
      l.rent,
      l.listing_start_date,
      l.listing_end_date,
      l.listing_status,
      l.created_at,
      p.title,
      p.description,
      p.area_name,
      p.property_size_sqft,
      p.room_count,
      p.bathroom_count,
      p.balcony_count,
      p.intended_tenant_type,
      p.building_floors,
      p.building_facing,
      p.has_lift,
      p.has_generator,
      p.has_security_guard,
      pi.storage_path AS primary_image_path
     FROM "Listing" l
     JOIN "Property" p ON p.property_id = l.property_id
     LEFT JOIN "PropertyImage" pi ON pi.property_id = p.property_id AND pi.is_primary = true
     WHERE l.listing_id = $1
       AND l.listing_status = 'ACTIVE'
     LIMIT 1`,
    [listingId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Listing not found');
  }

  const row = result.rows[0];

  const imageResult = await db.query(
    `SELECT image_id, storage_path, file_name, mime_type, is_primary, display_order
     FROM "PropertyImage"
     WHERE property_id = $1
     ORDER BY is_primary DESC, display_order ASC, uploaded_at ASC`,
    [row.property_id]
  );

  const unlockRequiredFields: Array<'address' | 'exactLat' | 'exactLng' | 'owner'> = [
    'address',
    'exactLat',
    'exactLng',
    'owner',
  ];

  const primaryImageUrl = await presignImageUrl(row.primary_image_path);
  const images = await Promise.all(
    imageResult.rows.map(async (img: any) => ({
      imageId: img.image_id,
      storagePath: img.storage_path,
      fileName: img.file_name,
      mimeType: img.mime_type,
      isPrimary: Boolean(img.is_primary),
      displayOrder: Number(img.display_order),
      url: await presignImageUrl(img.storage_path),
    }))
  );

  return {
    listingId: row.listing_id,
    propertyId: row.property_id,
    title: row.title,
    description: row.description,
    rent: Number(row.rent),
    listingStartDate: row.listing_start_date.toISOString(),
    listingEndDate: row.listing_end_date ? row.listing_end_date.toISOString() : null,
    listingStatus: row.listing_status,
    areaName: row.area_name,
    propertySizeSqft: Number(row.property_size_sqft),
    roomCount: Number(row.room_count),
    bathroomCount: Number(row.bathroom_count),
    balconyCount: Number(row.balcony_count),
    intendedTenantType: row.intended_tenant_type,
    primaryImagePath: row.primary_image_path,
    primaryImageUrl,
    createdAt: row.created_at.toISOString(),
    buildingFloors: Number(row.building_floors),
    buildingFacing: row.building_facing,
    hasLift: Boolean(row.has_lift),
    hasGenerator: Boolean(row.has_generator),
    hasSecurityGuard: Boolean(row.has_security_guard),
    images,
    isUnlocked: false,
    unlockRequiredFields,
    unlockFeeCode: 'LISTING_UNLOCK',
  };
}

export async function getListingDetailForAdmin(listingId: string) {
  const result = await db.query(
    `SELECT
      l.listing_id,
      l.property_id,
      l.rent,
      l.listing_start_date,
      l.listing_end_date,
      l.listing_status,
      l.created_at,
      p.title,
      p.description,
      p.area_name,
      p.property_size_sqft,
      p.room_count,
      p.bathroom_count,
      p.balcony_count,
      p.intended_tenant_type,
      p.building_floors,
      p.building_facing,
      p.has_lift,
      p.has_generator,
      p.has_security_guard,
      p.address,
      p.exact_lat,
      p.exact_lng,
      u.contact_email,
      u.contact_phone,
      pi.storage_path AS primary_image_path
     FROM "Listing" l
     JOIN "Property" p ON p.property_id = l.property_id
     JOIN "OwnerProfile" op ON op.owner_id = p.owner_id
     JOIN "User" u ON u.user_id = op.user_id
     LEFT JOIN "PropertyImage" pi ON pi.property_id = p.property_id AND pi.is_primary = true
     WHERE l.listing_id = $1
     LIMIT 1`,
    [listingId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Listing not found');
  }

  const row = result.rows[0];

  const imageResult = await db.query(
    `SELECT image_id, storage_path, file_name, mime_type, is_primary, display_order
     FROM "PropertyImage"
     WHERE property_id = $1
     ORDER BY is_primary DESC, display_order ASC, uploaded_at ASC`,
    [row.property_id]
  );

  const primaryImageUrl = await presignImageUrl(row.primary_image_path);
  const images = await Promise.all(
    imageResult.rows.map(async (img: any) => ({
      imageId: img.image_id,
      storagePath: img.storage_path,
      fileName: img.file_name,
      mimeType: img.mime_type,
      isPrimary: Boolean(img.is_primary),
      displayOrder: Number(img.display_order),
      url: await presignImageUrl(img.storage_path),
    }))
  );

  return {
    listingId: row.listing_id,
    propertyId: row.property_id,
    title: row.title,
    description: row.description,
    rent: Number(row.rent),
    listingStartDate: row.listing_start_date.toISOString(),
    listingEndDate: row.listing_end_date ? row.listing_end_date.toISOString() : null,
    listingStatus: row.listing_status,
    areaName: row.area_name,
    propertySizeSqft: Number(row.property_size_sqft),
    roomCount: Number(row.room_count),
    bathroomCount: Number(row.bathroom_count),
    balconyCount: Number(row.balcony_count),
    intendedTenantType: row.intended_tenant_type,
    primaryImagePath: row.primary_image_path,
    primaryImageUrl,
    createdAt: row.created_at.toISOString(),
    buildingFloors: Number(row.building_floors),
    buildingFacing: row.building_facing,
    hasLift: Boolean(row.has_lift),
    hasGenerator: Boolean(row.has_generator),
    hasSecurityGuard: Boolean(row.has_security_guard),
    images,
    address: row.address,
    exactLat: Number(row.exact_lat),
    exactLng: Number(row.exact_lng),
    ownerContact: {
      email: row.contact_email,
      phone: row.contact_phone,
    },
    isUnlocked: true,
    unlockRequiredFields: [] as Array<'address' | 'exactLat' | 'exactLng' | 'owner'>,
    unlockFeeCode: 'LISTING_UNLOCK',
  };
}

export async function unlockListingForTenant(userId: string, role: string, listingId: string) {
  await assertTenantActor(userId, role);

  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const listingResult = await client.query(
      `SELECT listing_id
       FROM "Listing"
       WHERE listing_id = $1
         AND listing_status = 'ACTIVE'
       LIMIT 1`,
      [listingId]
    );

    if (listingResult.rows.length === 0) {
      throw new AppError(404, 'Listing not found');
    }

    const existingUnlockResult = await client.query(
      `SELECT id
       FROM "ListingUnlock"
       WHERE listing_id = $1 AND tenant_user_id = $2
       LIMIT 1`,
      [listingId, userId]
    );

    if (existingUnlockResult.rows.length > 0) {
      // Look up existing conversation for idempotent response
      const existingConvResult = await client.query(
        `SELECT c.id FROM "Conversation" c
         JOIN "Listing" l ON l.property_id = c.property_id
         WHERE l.listing_id = $1 AND c.tenant_user_id = $2
         LIMIT 1`,
        [listingId, userId]
      );
      await client.query('COMMIT');
      return {
        listingId,
        unlockId: existingUnlockResult.rows[0].id,
        conversationId: existingConvResult.rows[0]?.id || null,
        isUnlocked: true,
        alreadyUnlocked: true,
        unlockRequiredFields: [] as Array<'address' | 'exactLat' | 'exactLng' | 'owner'>,
      };
    }

    const paid = await assertPaidActionAndDebit(client, {
      userId,
      feeCode: 'LISTING_UNLOCK',
      referenceType: 'LISTING_UNLOCK',
      referenceId: listingId,
      walletTxnType: 'ADJUSTMENT',
      description: `Listing unlock fee for listing ${listingId}`,
    });

    const unlockId = createId();
    await client.query(
      `INSERT INTO "ListingUnlock" (
        id, listing_id, tenant_user_id, charge_id, unlocked_at, created_at
      ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [unlockId, listingId, userId, paid.chargeId]
    );

    // Auto-create conversation: resolve owner and property from listing
    const ownerResult = await client.query(
      `SELECT o.user_id AS owner_user_id, l.property_id
       FROM "Listing" l
       JOIN "Property" p ON p.property_id = l.property_id
       JOIN "OwnerProfile" o ON o.owner_id = p.owner_id
       WHERE l.listing_id = $1`,
      [listingId]
    );
    const ownerUserId = ownerResult.rows[0].owner_user_id;
    const propertyId = ownerResult.rows[0].property_id;

    const conversationId = await createConversationOnUnlock(
      client, userId, propertyId, ownerUserId
    );

    await client.query('COMMIT');

    return {
      listingId,
      unlockId,
      conversationId,
      isUnlocked: true,
      alreadyUnlocked: false,
      unlockRequiredFields: [] as Array<'address' | 'exactLat' | 'exactLng' | 'owner'>,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getUnlockedListingDetailForTenant(userId: string, role: string, listingId: string) {
  if (role === 'ADMIN') {
    return getListingDetailForAdmin(listingId);
  }

  if (role === 'OWNER') {
    const result = await db.query(
      `SELECT
        l.listing_id,
        l.property_id,
        l.rent,
        l.listing_start_date,
        l.listing_end_date,
        l.listing_status,
        l.created_at,
        p.title,
        p.description,
        p.area_name,
        p.property_size_sqft,
        p.room_count,
        p.bathroom_count,
        p.balcony_count,
        p.intended_tenant_type,
        p.building_floors,
        p.building_facing,
        p.has_lift,
        p.has_generator,
        p.has_security_guard,
        p.address,
        p.exact_lat,
        p.exact_lng,
        u.contact_email,
        u.contact_phone,
        pi.storage_path AS primary_image_path
       FROM "Listing" l
       JOIN "Property" p ON p.property_id = l.property_id
       JOIN "OwnerProfile" op ON op.owner_id = p.owner_id
       JOIN "User" u ON u.user_id = op.user_id
       LEFT JOIN "PropertyImage" pi ON pi.property_id = p.property_id AND pi.is_primary = true
       WHERE l.listing_id = $1
         AND op.user_id = $2
       LIMIT 1`,
      [listingId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError(404, 'Listing not found');
    }

    const row = result.rows[0];

    const imageResult = await db.query(
      `SELECT image_id, storage_path, file_name, mime_type, is_primary, display_order
       FROM "PropertyImage"
       WHERE property_id = $1
       ORDER BY is_primary DESC, display_order ASC, uploaded_at ASC`,
      [row.property_id]
    );

    const primaryImageUrl = await presignImageUrl(row.primary_image_path);
    const images = await Promise.all(
      imageResult.rows.map(async (img: any) => ({
        imageId: img.image_id,
        storagePath: img.storage_path,
        fileName: img.file_name,
        mimeType: img.mime_type,
        isPrimary: Boolean(img.is_primary),
        displayOrder: Number(img.display_order),
        url: await presignImageUrl(img.storage_path),
      }))
    );

    return {
      listingId: row.listing_id,
      propertyId: row.property_id,
      title: row.title,
      description: row.description,
      rent: Number(row.rent),
      listingStartDate: row.listing_start_date.toISOString(),
      listingEndDate: row.listing_end_date ? row.listing_end_date.toISOString() : null,
      listingStatus: row.listing_status,
      areaName: row.area_name,
      propertySizeSqft: Number(row.property_size_sqft),
      roomCount: Number(row.room_count),
      bathroomCount: Number(row.bathroom_count),
      balconyCount: Number(row.balcony_count),
      intendedTenantType: row.intended_tenant_type,
      primaryImagePath: row.primary_image_path,
      primaryImageUrl,
      createdAt: row.created_at.toISOString(),
      buildingFloors: Number(row.building_floors),
      buildingFacing: row.building_facing,
      hasLift: Boolean(row.has_lift),
      hasGenerator: Boolean(row.has_generator),
      hasSecurityGuard: Boolean(row.has_security_guard),
      images,
      address: row.address,
      exactLat: Number(row.exact_lat),
      exactLng: Number(row.exact_lng),
      ownerContact: {
        email: row.contact_email,
        phone: row.contact_phone,
      },
      isUnlocked: true,
      unlockRequiredFields: [] as Array<'address' | 'exactLat' | 'exactLng' | 'owner'>,
      unlockFeeCode: 'LISTING_UNLOCK',
    };
  }

  await assertTenantActor(userId, role);

  const unlockResult = await db.query(
    `SELECT id
     FROM "ListingUnlock"
     WHERE listing_id = $1 AND tenant_user_id = $2
     LIMIT 1`,
    [listingId, userId]
  );

  if (unlockResult.rows.length === 0) {
    throw new AppError(403, 'Listing is locked for this tenant');
  }

  const result = await db.query(
    `SELECT
      l.listing_id,
      l.property_id,
      l.rent,
      l.listing_start_date,
      l.listing_end_date,
      l.listing_status,
      l.created_at,
      p.title,
      p.description,
      p.area_name,
      p.property_size_sqft,
      p.room_count,
      p.bathroom_count,
      p.balcony_count,
      p.intended_tenant_type,
      p.building_floors,
      p.building_facing,
      p.has_lift,
      p.has_generator,
      p.has_security_guard,
      p.address,
      p.exact_lat,
      p.exact_lng,
      u.contact_email,
      u.contact_phone,
      pi.storage_path AS primary_image_path
     FROM "Listing" l
     JOIN "Property" p ON p.property_id = l.property_id
     JOIN "OwnerProfile" op ON op.owner_id = p.owner_id
     JOIN "User" u ON u.user_id = op.user_id
     LEFT JOIN "PropertyImage" pi ON pi.property_id = p.property_id AND pi.is_primary = true
     WHERE l.listing_id = $1
       AND l.listing_status = 'ACTIVE'
     LIMIT 1`,
    [listingId]
  );

  if (result.rows.length === 0) {
    throw new AppError(404, 'Listing not found');
  }

  const row = result.rows[0];

  const imageResult = await db.query(
    `SELECT image_id, storage_path, file_name, is_primary, display_order
     FROM "PropertyImage"
     WHERE property_id = $1
     ORDER BY is_primary DESC, display_order ASC, uploaded_at ASC`,
    [row.property_id]
  );

  const primaryImageUrl = await presignImageUrl(row.primary_image_path);
  const images = await Promise.all(
    imageResult.rows.map(async (img: any) => ({
      imageId: img.image_id,
      storagePath: img.storage_path,
      fileName: img.file_name,
      isPrimary: Boolean(img.is_primary),
      displayOrder: Number(img.display_order),
      url: await presignImageUrl(img.storage_path),
    }))
  );

  return {
    listingId: row.listing_id,
    propertyId: row.property_id,
    title: row.title,
    description: row.description,
    rent: Number(row.rent),
    listingStartDate: row.listing_start_date.toISOString(),
    listingEndDate: row.listing_end_date ? row.listing_end_date.toISOString() : null,
    listingStatus: row.listing_status,
    areaName: row.area_name,
    propertySizeSqft: Number(row.property_size_sqft),
    roomCount: Number(row.room_count),
    bathroomCount: Number(row.bathroom_count),
    balconyCount: Number(row.balcony_count),
    intendedTenantType: row.intended_tenant_type,
    primaryImagePath: row.primary_image_path,
    primaryImageUrl,
    createdAt: row.created_at.toISOString(),
    buildingFloors: Number(row.building_floors),
    buildingFacing: row.building_facing,
    hasLift: Boolean(row.has_lift),
    hasGenerator: Boolean(row.has_generator),
    hasSecurityGuard: Boolean(row.has_security_guard),
    images,
    address: row.address,
    exactLat: Number(row.exact_lat),
    exactLng: Number(row.exact_lng),
    ownerContact: {
      email: row.contact_email,
      phone: row.contact_phone,
    },
    isUnlocked: true,
    unlockRequiredFields: [] as Array<'address' | 'exactLat' | 'exactLng' | 'owner'>,
    unlockFeeCode: 'LISTING_UNLOCK',
  };
}

export async function getPropertyImageUploadUrl(
  userId: string,
  role: string,
  propertyId: string,
  request: PropertyImageUploadUrlRequestInput
) {
  if (role !== 'OWNER') {
    throw new AppError(403, 'Only owners can upload property images');
  }

  await getPropertyByIdForActor(userId, role, propertyId);

  const timestamp = Date.now();
  const safeFileName = sanitizeFileName(request.fileName);
  const fileKey = `properties/${propertyId}/${timestamp}-${safeFileName}`;

  const presigned = await storage.presignUpload(fileKey, {
    fileName: request.fileName,
    mimeType: request.mimeType,
    maxSizeBytes: 100 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'],
  });

  return {
    uploadUrl: presigned.uploadUrl,
    expiresIn: presigned.expiresIn,
    fileKey,
  };
}

export async function createPropertyImage(
  userId: string,
  role: string,
  propertyId: string,
  input: CreatePropertyImageInput
) {
  if (role !== 'OWNER') {
    throw new AppError(403, 'Only owners can create property images');
  }

  await getPropertyByIdForActor(userId, role, propertyId);

  const expectedPrefix = `properties/${propertyId}/`;
  if (!input.filePath.startsWith(expectedPrefix)) {
    throw new AppError(400, `Invalid file path. File must be uploaded under ${expectedPrefix}`);
  }

  // Retry mechanism for MinIO/S3 eventual consistency
  let exists = false;
  for (let i = 0; i < 3; i++) {
    exists = await storage.exists(input.filePath);
    if (exists) break;
    // Wait 200ms before retrying
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  if (!exists) {
    throw new AppError(400, 'Uploaded file not found in storage. Please try again in a moment.');
  }

  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM "PropertyImage" WHERE property_id = $1`,
    [propertyId]
  );

  const hasImages = countResult.rows[0].total > 0;
  const isPrimary = input.isPrimary ?? !hasImages;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    if (isPrimary) {
      await client.query(
        `UPDATE "PropertyImage" SET is_primary = false WHERE property_id = $1`,
        [propertyId]
      );
    }

    const result = await client.query(
      `INSERT INTO "PropertyImage" (
        image_id,
        property_id,
        storage_path,
        file_name,
        file_size,
        mime_type,
        display_order,
        is_primary,
        alt_text
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        createId(),
        propertyId,
        input.filePath,
        input.fileName,
        input.fileSize,
        input.mimeType,
        input.displayOrder ?? 0,
        isPrimary,
        input.altText ?? null,
      ]
    );

    await client.query('COMMIT');
    return await mapPropertyImageWithUrl(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function listPropertyImages(userId: string, role: string, propertyId: string) {
  await getPropertyByIdForActor(userId, role, propertyId);

  const result = await db.query(
    `SELECT *
     FROM "PropertyImage"
     WHERE property_id = $1
     ORDER BY is_primary DESC, display_order ASC, uploaded_at ASC`,
    [propertyId]
  );

  const items = await Promise.all(result.rows.map(mapPropertyImageWithUrl));
  return { items, total: items.length };
}

export async function setPrimaryPropertyImage(
  userId: string,
  role: string,
  propertyId: string,
  imageId: string
) {
  if (role !== 'OWNER') {
    throw new AppError(403, 'Only owners can update primary image');
  }

  await getPropertyByIdForActor(userId, role, propertyId);

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const targetResult = await client.query(
      `SELECT * FROM "PropertyImage" WHERE image_id = $1 AND property_id = $2`,
      [imageId, propertyId]
    );

    if (targetResult.rows.length === 0) {
      throw new AppError(404, 'Property image not found');
    }

    await client.query(
      `UPDATE "PropertyImage" SET is_primary = false WHERE property_id = $1`,
      [propertyId]
    );

    const updatedResult = await client.query(
      `UPDATE "PropertyImage"
       SET is_primary = true
       WHERE image_id = $1 AND property_id = $2
       RETURNING *`,
      [imageId, propertyId]
    );

    await client.query('COMMIT');
    return await mapPropertyImageWithUrl(updatedResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteMyPropertyImageById(
  userId: string,
  role: string,
  propertyId: string,
  imageId: string
): Promise<void> {
  if (role !== 'OWNER') {
    throw new AppError(403, 'Only owners can delete property images');
  }

  await getPropertyByIdForActor(userId, role, propertyId);

  const client = await db.connect();
  let storagePath: string | null = null;
  try {
    await client.query('BEGIN');

    const found = await client.query(
      `SELECT image_id, storage_path, is_primary FROM "PropertyImage" WHERE image_id = $1 AND property_id = $2`,
      [imageId, propertyId]
    );

    if (found.rows.length === 0) {
      throw new AppError(404, 'Property image not found');
    }

    const wasPrimary = Boolean(found.rows[0].is_primary);
    storagePath = found.rows[0].storage_path as string;

    await client.query(`DELETE FROM "PropertyImage" WHERE image_id = $1 AND property_id = $2`, [imageId, propertyId]);

    if (wasPrimary) {
      await client.query(`UPDATE "PropertyImage" SET is_primary = false WHERE property_id = $1`, [propertyId]);
      const next = await client.query(
        `SELECT image_id FROM "PropertyImage" WHERE property_id = $1 ORDER BY display_order ASC, uploaded_at ASC LIMIT 1`,
        [propertyId]
      );
      if (next.rows.length > 0) {
        await client.query(`UPDATE "PropertyImage" SET is_primary = true WHERE image_id = $1`, [
          next.rows[0].image_id,
        ]);
      }
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }

  if (storagePath) {
    try {
      await storage.deleteObject(storagePath);
    } catch (err) {
      console.warn('[PropertyImage] Storage delete failed after DB removal:', err);
    }
  }
}

/**
 * Permanently delete a property and related listings, images, unlocks, wishlist rows, and wallet/charge refs.
 * Only the owning owner may delete.
 */
export async function deleteMyPropertyById(userId: string, propertyId: string) {
  const ownerId = await getOwnerIdByUserId(userId);

  const ownCheck = await db.query(
    `SELECT property_id FROM "Property" WHERE property_id = $1 AND owner_id = $2 LIMIT 1`,
    [propertyId, ownerId]
  );
  if (ownCheck.rows.length === 0) {
    throw new AppError(404, 'Property not found');
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const listingsRes = await client.query(`SELECT listing_id FROM "Listing" WHERE property_id = $1`, [
      propertyId,
    ]);
    const listingIds: string[] = listingsRes.rows.map((r: any) => r.listing_id as string);

    if (listingIds.length > 0) {
      await client.query(`DELETE FROM "Wishlist" WHERE listing_id = ANY($1::text[])`, [listingIds]);
      await client.query(`DELETE FROM "ListingUnlock" WHERE listing_id = ANY($1::text[])`, [listingIds]);
      await client.query(
        `DELETE FROM "WalletTransaction"
         WHERE reference_id = ANY($1::text[])
           AND reference_type IN ('LISTING', 'LISTING_UNLOCK')`,
        [listingIds]
      );
      await client.query(
        `DELETE FROM "Charge"
         WHERE reference_id = ANY($1::text[])
           AND reference_type IN ('LISTING', 'LISTING_UNLOCK')`,
        [listingIds]
      );
      await client.query(`DELETE FROM "Listing" WHERE property_id = $1`, [propertyId]);
    }

    await client.query(`DELETE FROM "PropertyImage" WHERE property_id = $1`, [propertyId]);
    const delProp = await client.query(`DELETE FROM "Property" WHERE property_id = $1 AND owner_id = $2`, [
      propertyId,
      ownerId,
    ]);
    if (delProp.rowCount === 0) {
      throw new AppError(404, 'Property could not be deleted');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
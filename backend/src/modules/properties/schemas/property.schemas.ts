import { z } from '@hono/zod-openapi';
import { AreaName, BuildingFacing, ListingStatus, TenantType, PropertyType, PropertyCategory } from '@/types/enums';

export const propertyIdParamSchema = z.object({
  propertyId: z.string().openapi({
    param: { name: 'propertyId', in: 'path' },
    example: 'cm5prop123xyz',
    description: 'Property ID',
  }),
});

export const ownerUserIdParamSchema = z.object({
  ownerUserId: z.string().openapi({
    param: { name: 'ownerUserId', in: 'path' },
    example: 'cm5owner123xyz',
    description: 'Owner user ID',
  }),
});

export const imageIdParamSchema = z.object({
  imageId: z.string().openapi({
    param: { name: 'imageId', in: 'path' },
    example: 'cm5img123xyz',
    description: 'Property image ID',
  }),
});

export const createPropertySchema = z.object({
  title: z.string().min(3).max(120).openapi({ example: '3 Bedroom Apartment in Dhanmondi' }),
  description: z.string().max(5000),
  address: z.string().max(500),
  propertySizeSqft: z.number().positive().openapi({ example: 1450 }),
  roomCount: z.number().nonnegative().openapi({ example: 3 }),
  bathroomCount: z.number().nonnegative().openapi({ example: 2 }),
  balconyCount: z.number().int().nonnegative().openapi({ example: 1 }),
  areaName: AreaName,
  exactLat: z.number().min(-90).max(90),
  exactLng: z.number().min(-180).max(180),
  buildingFloors: z.number().int().positive(),
  buildingFacing: BuildingFacing,
  hasLift: z.boolean(),
  hasGenerator: z.boolean(),
  hasSecurityGuard: z.boolean(),
  intendedTenantType: TenantType,
  // propertyType accepted when provided (defaults to APARTMENT in DB)
  propertyType: PropertyType.optional(),
  floorNo: z.number().int().positive().openapi({ example: 4 }),
  flatNo: z.string().max(50).optional().openapi({ example: '4A' }),
});

export const updatePropertySchema = createPropertySchema.partial();

export const propertyResponseSchema = z.object({
  propertyId: z.string(),
  ownerId: z.string(),
  propertyType: PropertyType,
  propertySizeSqft: z.number().nullable(),
  roomCount: z.number().nullable(),
  bathroomCount: z.number().nullable(),
  balconyCount: z.number().nullable(),
  areaName: AreaName.nullable(),
  exactLat: z.number().nullable(),
  exactLng: z.number().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  address: z.string().nullable(),
  buildingFloors: z.number().nullable(),
  buildingFacing: BuildingFacing.nullable(),
  hasLift: z.boolean().nullable(),
  hasGenerator: z.boolean().nullable(),
  hasSecurityGuard: z.boolean().nullable(),
  intendedTenantType: TenantType.nullable(),
  floorNo: z.number().nullable(),
  flatNo: z.string().nullable(),
  propertyAddressBn: z.string().nullable().optional(),
  floorNoBn: z.string().nullable().optional(),
  flatNoBn: z.string().nullable().optional(),
  createdAt: z.string(),
});

export const propertyListResponseSchema = z.object({
  items: z.array(propertyResponseSchema),
  total: z.number().int().nonnegative(),
});

export const propertyImageUploadUrlRequestSchema = z.object({
  fileName: z.string().regex(/\.(jpg|jpeg|png|webp|mp4|webm|mov|m4v)$/i).openapi({
    example: 'living-room.jpg',
    description: 'Media file name',
  }),
  mimeType: z
    .enum(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'])
    .openapi({
      example: 'image/jpeg',
    }),
  fileSize: z
    .number()
    .max(100 * 1024 * 1024, 'File size exceeds the 100MB limit')
    .openapi({
      example: 1048576,
      description: 'File size in bytes (max 100MB)',
    }),

});

export const propertyImageUploadUrlResponseSchema = z.object({
  uploadUrl: z.string().url(),
  expiresIn: z.number().int().positive(),
  fileKey: z.string(),
});

export const createPropertyImageSchema = z.object({
  filePath: z.string().min(1).openapi({
    example: 'properties/cm5prop123xyz/1712200000000-living-room.jpg',
  }),
  fileName: z.string().min(1).max(255),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']),
  fileSize: z.number().int().positive().max(100 * 1024 * 1024).openapi({
    example: 734122,
    description: 'File size in bytes, max 100MB',
  }),
  displayOrder: z.number().int().nonnegative().optional(),
  isPrimary: z.boolean().optional(),
  altText: z.string().max(300).optional(),
});

export const propertyImageResponseSchema = z.object({
  imageId: z.string(),
  propertyId: z.string(),
  storagePath: z.string(),
  url: z.string().url().nullable().optional(),
  fileName: z.string(),
  fileSize: z.number().nullable(),
  mimeType: z.string().nullable(),
  displayOrder: z.number(),
  isPrimary: z.boolean(),
  altText: z.string().nullable(),
  uploadedAt: z.string(),
});

export const propertyImageListResponseSchema = z.object({
  items: z.array(propertyImageResponseSchema),
  total: z.number().int().nonnegative(),
});

export const createListingSchema = z
  .object({
    rent: z.number().positive().openapi({ example: 35000 }),
    listingStartDate: z.string().datetime().openapi({
      example: '2026-04-15T00:00:00.000Z',
      description: 'Listing start date-time (ISO 8601)',
    }),
    listingEndDate: z.string().datetime().optional().openapi({
      example: '2026-10-15T00:00:00.000Z',
      description: 'Optional listing end date-time (ISO 8601)',
    }),
  })
  .refine(
    (data) => {
      if (!data.listingEndDate) {
        return true;
      }
      return new Date(data.listingEndDate).getTime() > new Date(data.listingStartDate).getTime();
    },
    {
      message: 'listingEndDate must be after listingStartDate',
      path: ['listingEndDate'],
    }
  );

export const listingResponseSchema = z.object({
  listingId: z.string(),
  propertyId: z.string(),
  rent: z.number(),
  listingStartDate: z.string(),
  listingEndDate: z.string().nullable(),
  listingStatus: ListingStatus,
  viewCount: z.number().int().nonnegative(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export const listingListResponseSchema = z.object({
  items: z.array(listingResponseSchema),
  total: z.number().int().nonnegative(),
});

/** Owner pause (UNLISTED) / resume (ACTIVE). Other status changes are not allowed here. */
export const updateListingStatusSchema = z.object({
  listingStatus: z.enum(['ACTIVE', 'UNLISTED']).openapi({
    example: 'UNLISTED',
    description: 'Set ACTIVE to publish again, or UNLISTED to pause (hide from public feed).',
  }),
});

export type UpdateListingStatusInput = z.infer<typeof updateListingStatusSchema>;

export const listingIdParamSchema = z.object({
  listingId: z.string().openapi({
    param: { name: 'listingId', in: 'path' },
    example: 'cm5listing123xyz',
    description: 'Listing ID',
  }),
});

const unlockFieldSchema = z.enum(['address', 'exactLat', 'exactLng', 'owner']);

const ownerContactSchema = z.object({
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
});

export const unlockListingResponseSchema = z.object({
  listingId: z.string(),
  unlockId: z.string(),
  isUnlocked: z.boolean(),
  alreadyUnlocked: z.boolean(),
  unlockRequiredFields: z.array(unlockFieldSchema),
});

export const publicListingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1).openapi({
    example: 1,
    description: 'Page number (1-indexed)',
  }),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20).openapi({
    example: 20,
    description: 'Results per page (max 100)',
  }),
  areaName: AreaName.optional().openapi({
    example: 'DHANMONDI',
    description: 'Filter by area',
  }),
  minRent: z.coerce.number().positive().optional().openapi({
    example: 10000,
    description: 'Minimum rent filter',
  }),
  maxRent: z.coerce.number().positive().optional().openapi({
    example: 50000,
    description: 'Maximum rent filter',
  }),
  roomCount: z.coerce.number().nonnegative().optional().openapi({
    example: 2,
    description: 'Exact room count filter',
  }),
  minRoomCount: z.coerce.number().nonnegative().optional().openapi({
    example: 2,
    description: 'Minimum bedroom count (inclusive); use instead of roomCount for “at least N beds” search',
  }),
  propertyCategory: PropertyCategory.optional().openapi({
    example: 'RESIDENTIAL',
    description: 'Filter by owner portfolio category (residential vs commercial listings)',
  }),
  bathroomCount: z.coerce.number().nonnegative().optional().openapi({
    example: 2,
    description: 'Exact bathroom count filter',
  }),
  intendedTenantType: TenantType.optional().openapi({
    example: 'FAMILY',
    description: 'Filter by intended tenant type',
  }),
  sortBy: z.enum(['createdAt', 'rent', 'listingStartDate']).optional().default('createdAt').openapi({
    example: 'createdAt',
    description: 'Sort field',
  }),
  sortDir: z.enum(['asc', 'desc']).optional().default('desc').openapi({
    example: 'desc',
    description: 'Sort direction',
  }),
});

export type PublicListingsQueryInput = z.infer<typeof publicListingsQuerySchema>;

/** Admin: list any listing status with the same filters as public search. */
export const adminListingsQuerySchema = publicListingsQuerySchema.extend({
  listingStatus: ListingStatus.optional().openapi({
    description: 'When set, only listings in this status are returned',
  }),
});

export type AdminListingsQueryInput = z.infer<typeof adminListingsQuerySchema>;

export const publicListingSummarySchema = z.object({
  listingId: z.string(),
  propertyId: z.string(),
  title: z.string(),
  description: z.string(),
  rent: z.number(),
  listingStartDate: z.string(),
  listingEndDate: z.string().nullable(),
  listingStatus: ListingStatus,
  areaName: AreaName,
  propertySizeSqft: z.number(),
  roomCount: z.number(),
  bathroomCount: z.number(),
  balconyCount: z.number(),
  intendedTenantType: TenantType,
  primaryImagePath: z.string().nullable(),
  primaryImageUrl: z.string().url().nullable().optional(),
  viewCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export const publicListingDetailSchema = publicListingSummarySchema.extend({
  buildingFloors: z.number(),
  buildingFacing: BuildingFacing,
  hasLift: z.boolean(),
  hasGenerator: z.boolean(),
  hasSecurityGuard: z.boolean(),
  floorNo: z.number().nullable(),
  propertyAddressBn: z.string().nullable().optional(),
  floorNoBn: z.string().nullable().optional(),
  flatNoBn: z.string().nullable().optional(),
  images: z.array(z.object({
    imageId: z.string(),
    storagePath: z.string(),
    fileName: z.string(),
    isPrimary: z.boolean(),
    displayOrder: z.number(),
    url: z.string().url().nullable().optional(),
  })),
  isUnlocked: z.boolean().openapi({
    example: false,
    description: 'Whether current viewer has unlocked sensitive fields for this listing',
  }),
  unlockRequiredFields: z.array(unlockFieldSchema).openapi({
    example: ['address', 'exactLat', 'exactLng', 'owner'],
    description: 'Fields that remain hidden until unlock',
  }),
  unlockFeeCode: z.string().openapi({
    example: 'LISTING_UNLOCK',
    description: 'Fee policy code required to unlock hidden fields',
  }),
});

export const unlockedListingDetailSchema = publicListingSummarySchema.extend({
  propertyType: PropertyType.optional(),
  buildingFloors: z.number(),
  buildingFacing: BuildingFacing,
  hasLift: z.boolean(),
  hasGenerator: z.boolean(),
  hasSecurityGuard: z.boolean(),
  floorNo: z.number().nullable(),
  flatNo: z.string().nullable(),
  propertyAddressBn: z.string().nullable().optional(),
  floorNoBn: z.string().nullable().optional(),
  flatNoBn: z.string().nullable().optional(),
  images: z.array(z.object({
    imageId: z.string(),
    storagePath: z.string(),
    fileName: z.string(),
    mimeType: z.string().nullable().optional(),
    isPrimary: z.boolean(),
    displayOrder: z.number(),
    url: z.string().url().nullable().optional(),
  })),
  address: z.string(),
  exactLat: z.number(),
  exactLng: z.number(),
  ownerContact: ownerContactSchema,
  isUnlocked: z.boolean(),
  unlockRequiredFields: z.array(unlockFieldSchema),
  unlockFeeCode: z.string(),
});

export const publicListingListResponseSchema = z.object({
  items: z.array(publicListingSummarySchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export const incrementListingViewResponseSchema = z.object({
  listingId: z.string(),
  viewCount: z.number().int().nonnegative(),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyImageUploadUrlRequestInput = z.infer<typeof propertyImageUploadUrlRequestSchema>;
export type CreatePropertyImageInput = z.infer<typeof createPropertyImageSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UnlockListingResponseType = z.infer<typeof unlockListingResponseSchema>;
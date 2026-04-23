import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import {
  createPropertyImageSchema,
  createPropertySchema,
  imageIdParamSchema,
  ownerUserIdParamSchema,
  propertyImageListResponseSchema,
  propertyImageResponseSchema,
  propertyImageUploadUrlRequestSchema,
  propertyImageUploadUrlResponseSchema,
  propertyIdParamSchema,
  listingIdParamSchema,
  unlockListingResponseSchema,
  createListingSchema,
  listingListResponseSchema,
  listingResponseSchema,
  publicListingsQuerySchema,
  publicListingListResponseSchema,
  publicListingDetailSchema,
  unlockedListingDetailSchema,
  propertyListResponseSchema,
  propertyResponseSchema,
  updatePropertySchema,
  updateListingStatusSchema,
} from '../schemas';

const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string(),
});

export const createPropertyRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Properties'],
  summary: 'Create property',
  description: 'Create a new property for the authenticated owner. Property type defaults to APARTMENT.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createPropertySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Property created',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: propertyResponseSchema,
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const listMyPropertiesRoute = createRoute({
  method: 'get',
  path: '/me',
  tags: ['Properties'],
  summary: 'List my properties',
  responses: {
    200: {
      description: 'Owner properties fetched',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: propertyListResponseSchema,
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const listOwnerPropertiesForAdminRoute = createRoute({
  method: 'get',
  path: '/owners/{ownerUserId}',
  tags: ['Properties'],
  summary: 'Admin: list properties by owner user ID',
  request: {
    params: ownerUserIdParamSchema,
  },
  responses: {
    200: {
      description: 'Owner properties fetched',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: propertyListResponseSchema,
          }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const getMyPropertyRoute = createRoute({
  method: 'get',
  path: '/{propertyId}',
  tags: ['Properties'],
  summary: 'Get one of my properties',
  request: {
    params: propertyIdParamSchema,
  },
  responses: {
    200: {
      description: 'Property fetched',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: propertyResponseSchema,
          }),
        },
      },
    },
    404: {
      description: 'Property not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const deleteMyPropertyRoute = createRoute({
  method: 'delete',
  path: '/{propertyId}',
  tags: ['Properties'],
  summary: 'Delete my property',
  description:
    'Permanently removes the property, its images, listings, tenant wishlist entries, unlocks, and related wallet/charge records. Owner only.',
  request: {
    params: propertyIdParamSchema,
  },
  responses: {
    200: {
      description: 'Property deleted',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
          }),
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Property not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const updateMyPropertyRoute = createRoute({
  method: 'patch',
  path: '/{propertyId}',
  tags: ['Properties'],
  summary: 'Update one of my properties',
  request: {
    params: propertyIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: updatePropertySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Property updated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: propertyResponseSchema,
          }),
        },
      },
    },
    404: {
      description: 'Property not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const getPropertyImageUploadUrlRoute = createRoute({
  method: 'post',
  path: '/{propertyId}/images/upload-url',
  tags: ['Properties'],
  summary: 'Get presigned upload URL for property image',
  request: {
    params: propertyIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: propertyImageUploadUrlRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Upload URL generated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: propertyImageUploadUrlResponseSchema,
          }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Property not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const createPropertyImageRoute = createRoute({
  method: 'post',
  path: '/{propertyId}/images',
  tags: ['Properties'],
  summary: 'Create property image metadata after upload',
  request: {
    params: propertyIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: createPropertyImageSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Property image created',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: propertyImageResponseSchema,
          }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Property not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const listPropertyImagesRoute = createRoute({
  method: 'get',
  path: '/{propertyId}/images',
  tags: ['Properties'],
  summary: 'List property images',
  request: {
    params: propertyIdParamSchema,
  },
  responses: {
    200: {
      description: 'Property images fetched',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: propertyImageListResponseSchema,
          }),
        },
      },
    },
    404: {
      description: 'Property not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const setPrimaryPropertyImageRoute = createRoute({
  method: 'patch',
  path: '/{propertyId}/images/{imageId}/primary',
  tags: ['Properties'],
  summary: 'Set primary image for a property',
  request: {
    params: propertyIdParamSchema.merge(imageIdParamSchema),
  },
  responses: {
    200: {
      description: 'Primary image updated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: propertyImageResponseSchema,
          }),
        },
      },
    },
    404: {
      description: 'Property or image not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const deletePropertyImageRoute = createRoute({
  method: 'delete',
  path: '/{propertyId}/images/{imageId}',
  tags: ['Properties'],
  summary: 'Delete a property image',
  description: 'Removes the image record and file from storage. If it was primary, another image becomes primary when available.',
  request: {
    params: propertyIdParamSchema.merge(imageIdParamSchema),
  },
  responses: {
    200: {
      description: 'Image deleted',
      content: {
        'application/json': {
          schema: z.object({ success: z.boolean() }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Property or image not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const createListingRoute = createRoute({
  method: 'post',
  path: '/{propertyId}/listings',
  tags: ['Properties'],
  summary: 'Create listing for a property (paid action)',
  description: 'Creates a rental listing for a property. Owners are charged from wallet using fee code LISTING_CREATE. Admins bypass fee assertion.',
  request: {
    params: propertyIdParamSchema,
    body: {
      content: {
        'application/json': {
          schema: createListingSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Listing created',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: listingResponseSchema,
          }),
        },
      },
    },
    402: {
      description: 'Payment required (insufficient wallet balance)',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Property not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Conflict (listing fee policy missing or property already has an active listing)',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const listPropertyListingsRoute = createRoute({
  method: 'get',
  path: '/{propertyId}/listings',
  tags: ['Properties'],
  summary: 'List listings of a property (owner/admin)',
  request: {
    params: propertyIdParamSchema,
  },
  responses: {
    200: {
      description: 'Property listings fetched',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: listingListResponseSchema,
          }),
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Property not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const updateMyListingStatusRoute = createRoute({
  method: 'patch',
  path: '/{propertyId}/listings/{listingId}',
  tags: ['Properties'],
  summary: 'Update listing visibility (owner/admin)',
  description:
    'Pause a listing (set UNLISTED — hidden from public search) or resume (set ACTIVE). Only UNLISTED listings can be set ACTIVE when the property has no other active listing.',
  request: {
    params: propertyIdParamSchema.merge(listingIdParamSchema),
    body: {
      content: {
        'application/json': {
          schema: updateListingStatusSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Listing updated',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: listingResponseSchema,
          }),
        },
      },
    },
    400: {
      description: 'Invalid status transition',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Forbidden',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Property or listing not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Property already has another active listing',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const listPublicListingsRoute = createRoute({
  method: 'get',
  path: '/public/listings',
  tags: ['Properties'],
  summary: 'Public listing feed',
  description: 'Public feed of active rental listings with filters and sorting. Sensitive fields are intentionally excluded.',
  request: {
    query: publicListingsQuerySchema,
  },
  responses: {
    200: {
      description: 'Public listings fetched',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: publicListingListResponseSchema,
          }),
        },
      },
    },
  },
});

export const getPublicListingDetailRoute = createRoute({
  method: 'get',
  path: '/public/listings/{listingId}',
  tags: ['Properties'],
  summary: 'Public listing details (masked)',
  description: 'Public detail view for one active listing. Address, exact location, and owner info are excluded.',
  request: {
    params: listingIdParamSchema,
  },
  responses: {
    200: {
      description: 'Public listing detail fetched',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: publicListingDetailSchema,
          }),
        },
      },
    },
    404: {
      description: 'Listing not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});

export const unlockListingRoute = createRoute({
  method: 'post',
  path: '/listings/{listingId}/unlock',
  tags: ['Properties'],
  summary: 'Unlock listing details (tenant)',
  description: 'Charges tenant wallet using LISTING_UNLOCK fee policy and permanently unlocks sensitive fields for this listing.',
  request: {
    params: listingIdParamSchema,
  },
  responses: {
    200: {
      description: 'Listing unlocked',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: unlockListingResponseSchema,
          }),
        },
      },
    },
    402: {
      description: 'Payment required',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    403: {
      description: 'Forbidden (tenant only)',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Listing not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    409: {
      description: 'Unlock fee policy not configured',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});

export const getUnlockedListingDetailRoute = createRoute({
  method: 'get',
  path: '/listings/{listingId}/details',
  tags: ['Properties'],
  summary: 'Get unlocked listing details (tenant)',
  description: 'Returns address, exact coordinates, and owner contact only if this tenant has unlocked the listing.',
  request: {
    params: listingIdParamSchema,
  },
  responses: {
    200: {
      description: 'Unlocked listing detail fetched',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: unlockedListingDetailSchema,
          }),
        },
      },
    },
    403: {
      description: 'Listing not unlocked for this tenant',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Listing not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
});
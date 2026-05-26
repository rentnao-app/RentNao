import type { OpenAPIHono } from '@hono/zod-openapi';
import { AppError } from '@/errors/base';
import { dispatchTransliteration } from '@/modules/deals/transliteration';
import {
  createPropertyImageRoute,
  createListingRoute,
  getPublicListingDetailRoute,
  getUnlockedListingDetailRoute,
  createPropertyRoute,
  getPropertyImageUploadUrlRoute,
  getMyPropertyRoute,
  deleteMyPropertyRoute,
  listPublicListingsRoute,
  listPropertyListingsRoute,
  updateMyListingStatusRoute,
  listOwnerPropertiesForAdminRoute,
  listPropertyImagesRoute,
  listMyPropertiesRoute,
  setPrimaryPropertyImageRoute,
  deletePropertyImageRoute,
  unlockListingRoute,
  updateMyPropertyRoute,
} from '../routes';
import {
  createPropertyImage,
  createListingForProperty,
  createProperty,
  getPublicListingDetail,
  getUnlockedListingDetailForTenant,
  getPropertyByIdForUserRole,
  getPropertyImageUploadUrl,
  listListingsByPropertyForUserRole,
  updateMyListingStatus,
  listPublicListings,
  listPropertiesByOwnerUserId,
  listPropertyImages,
  listMyProperties,
  setPrimaryPropertyImage,
  deleteMyPropertyImageById,
  unlockListingForTenant,
  updateMyPropertyById,
  deleteMyPropertyById,
} from '../services/property.service';

export function registerPropertyRoutes(app: OpenAPIHono) {
  app.openapi(createPropertyRoute, async (c) => {
    const user = c.get('user');
    if (user.role !== 'OWNER') {
      throw new AppError(403, 'Only owners can create properties');
    }

    const body = c.req.valid('json');
    const data = await createProperty(user.userId, body);

    dispatchTransliteration(
      {
        floorNo: body.floorNo,
        flatNo: body.flatNo,
        propertyAddress: body.address,
      },
      {
        table: 'Property',
        idColumn: 'property_id',
        idValue: data.propertyId,
      }
    );

    return c.json({ success: true, data }, 201);
  });

  app.openapi(listMyPropertiesRoute, async (c) => {
    const user = c.get('user');
    if (user.role !== 'OWNER') {
      throw new AppError(403, 'Only owners can list their own properties');
    }

    const data = await listMyProperties(user.userId);
    return c.json({ success: true, data }, 200);
  });

  app.openapi(listOwnerPropertiesForAdminRoute, async (c) => {
    const user = c.get('user');
    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'Only admins can list properties for any owner');
    }

    const { ownerUserId } = c.req.valid('param');
    const data = await listPropertiesByOwnerUserId(ownerUserId);
    return c.json({ success: true, data }, 200);
  });

  app.openapi(getMyPropertyRoute, async (c) => {
    const user = c.get('user');
    const { propertyId } = c.req.valid('param');
    const data = await getPropertyByIdForUserRole(user.userId, user.role, propertyId);
    return c.json({ success: true, data }, 200);
  });

  app.openapi(updateMyPropertyRoute, async (c) => {
    const user = c.get('user');
    if (user.role !== 'OWNER') {
      throw new AppError(403, 'Only owners can update properties');
    }

    const { propertyId } = c.req.valid('param');
    const body = c.req.valid('json');

    if (Object.keys(body).length === 0) {
      throw new AppError(400, 'Request body cannot be empty');
    }

    const data = await updateMyPropertyById(user.userId, propertyId, body);

    dispatchTransliteration(
      {
        floorNo: body.floorNo,
        flatNo: body.flatNo,
        propertyAddress: body.address,
      },
      {
        table: 'Property',
        idColumn: 'property_id',
        idValue: propertyId,
      }
    );

    return c.json({ success: true, data }, 200);
  });

  app.openapi(deleteMyPropertyRoute, async (c) => {
    const user = c.get('user');
    if (user.role !== 'OWNER') {
      throw new AppError(403, 'Only owners can delete properties');
    }

    const { propertyId } = c.req.valid('param');
    await deleteMyPropertyById(user.userId, propertyId);
    return c.json({ success: true }, 200);
  });

  app.openapi(getPropertyImageUploadUrlRoute, async (c) => {
    const user = c.get('user');
    const { propertyId } = c.req.valid('param');
    const body = c.req.valid('json');

    const data = await getPropertyImageUploadUrl(user.userId, user.role, propertyId, body);
    return c.json({ success: true, data }, 200);
  });

  app.openapi(createPropertyImageRoute, async (c) => {
    const user = c.get('user');
    const { propertyId } = c.req.valid('param');
    const body = c.req.valid('json');

    const data = await createPropertyImage(user.userId, user.role, propertyId, body);
    return c.json({ success: true, data }, 201);
  });

  app.openapi(listPropertyImagesRoute, async (c) => {
    const user = c.get('user');
    const { propertyId } = c.req.valid('param');

    const data = await listPropertyImages(user.userId, user.role, propertyId);
    return c.json({ success: true, data }, 200);
  });

  app.openapi(setPrimaryPropertyImageRoute, async (c) => {
    const user = c.get('user');
    const { propertyId, imageId } = c.req.valid('param');

    const data = await setPrimaryPropertyImage(user.userId, user.role, propertyId, imageId);
    return c.json({ success: true, data }, 200);
  });

  app.openapi(deletePropertyImageRoute, async (c) => {
    const user = c.get('user');
    const { propertyId, imageId } = c.req.valid('param');

    await deleteMyPropertyImageById(user.userId, user.role, propertyId, imageId);
    return c.json({ success: true }, 200);
  });

  app.openapi(createListingRoute, async (c) => {
    const user = c.get('user');
    const { propertyId } = c.req.valid('param');
    const body = c.req.valid('json');

    const data = await createListingForProperty(user.userId, user.role, propertyId, body);
    return c.json({ success: true, data }, 201);
  });

  app.openapi(listPropertyListingsRoute, async (c) => {
    const user = c.get('user');
    const { propertyId } = c.req.valid('param');

    const data = await listListingsByPropertyForUserRole(user.userId, user.role, propertyId);
    return c.json({ success: true, data }, 200);
  });

  app.openapi(updateMyListingStatusRoute, async (c) => {
    const user = c.get('user');
    if (user.role !== 'OWNER' && user.role !== 'ADMIN') {
      throw new AppError(403, 'Only owners or admins can update listing status');
    }

    const { propertyId, listingId } = c.req.valid('param');
    const body = c.req.valid('json');

    const data = await updateMyListingStatus(user.userId, user.role, propertyId, listingId, body);
    return c.json({ success: true, data }, 200);
  });

  app.openapi(unlockListingRoute, async (c) => {
    const user = c.get('user');
    const { listingId } = c.req.valid('param');

    const data = await unlockListingForTenant(user.userId, user.role, listingId);
    return c.json({ success: true, data }, 200);
  });

  app.openapi(getUnlockedListingDetailRoute, async (c) => {
    const user = c.get('user');
    const { listingId } = c.req.valid('param');

    const data = await getUnlockedListingDetailForTenant(user.userId, user.role, listingId);
    return c.json({ success: true, data }, 200);
  });
}

export function registerPublicPropertyRoutes(app: OpenAPIHono) {
  app.openapi(listPublicListingsRoute, async (c) => {
    const query = c.req.valid('query');
    const data = await listPublicListings(query);
    return c.json({ success: true, data }, 200);
  });

  app.openapi(getPublicListingDetailRoute, async (c) => {
    const { listingId } = c.req.valid('param');
    const data = await getPublicListingDetail(listingId);
    return c.json({ success: true, data }, 200);
  });
}
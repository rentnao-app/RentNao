import { OpenAPIHono } from '@hono/zod-openapi';
import {
  getListingDetailForAdmin,
  listListingsForAdmin,
  updateListingPropertyTypeForAdmin,
} from '@/modules/properties/services';
import * as adminRoutes from '../routes';

export function registerListingRoutes(admin: OpenAPIHono) {
  admin.openapi(adminRoutes.listAdminListingsRoute, async (c) => {
    const query = c.req.valid('query');
    const data = await listListingsForAdmin(query);
    return c.json({ success: true, data }, 200);
  });

  admin.openapi(adminRoutes.getAdminListingDetailRoute, async (c) => {
    const { listingId } = c.req.valid('param');
    const data = await getListingDetailForAdmin(listingId);
    return c.json({ success: true, data }, 200);
  });

  admin.openapi(adminRoutes.updateAdminListingPropertyTypeRoute, async (c) => {
    const { listingId } = c.req.valid('param');
    const body = c.req.valid('json');
    const data = await updateListingPropertyTypeForAdmin(listingId, body.propertyType);
    return c.json(
      {
        success: true,
        data,
        message: `Property type updated to ${body.propertyType}`,
      },
      200
    );
  });
}

import { OpenAPIHono } from '@hono/zod-openapi';
import { getListingDetailForAdmin, listListingsForAdmin } from '@/modules/properties/services';
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
}

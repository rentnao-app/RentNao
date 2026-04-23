import type { OpenAPIHono } from '@hono/zod-openapi';
import { addWishlistRoute, listWishlistRoute, removeWishlistRoute, wishlistStatusRoute } from './wishlist.routes';
import {
  addListingToWishlist,
  isListingWishlisted,
  listWishlistForTenant,
  removeListingFromWishlist,
} from './wishlist.service';

export function registerWishlistRoutes(app: OpenAPIHono) {
  app.openapi(listWishlistRoute, async (c) => {
    const user = c.get('user');
    const items = await listWishlistForTenant(user.userId, user.role);
    return c.json({ success: true, data: { items } }, 200);
  });

  app.openapi(wishlistStatusRoute, async (c) => {
    const user = c.get('user');
    const { listingId } = c.req.valid('param');
    const wishlisted = await isListingWishlisted(user.userId, user.role, listingId);
    return c.json({ success: true, data: { wishlisted } }, 200);
  });

  app.openapi(addWishlistRoute, async (c) => {
    const user = c.get('user');
    const { listingId } = c.req.valid('param');
    await addListingToWishlist(user.userId, user.role, listingId);
    return c.json({ success: true, message: 'Saved to wishlist' }, 201);
  });

  app.openapi(removeWishlistRoute, async (c) => {
    const user = c.get('user');
    const { listingId } = c.req.valid('param');
    await removeListingFromWishlist(user.userId, user.role, listingId);
    return c.json({ success: true }, 200);
  });
}

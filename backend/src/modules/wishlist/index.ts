import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { requireAuth } from '@/security';
import { registerWishlistRoutes } from './wishlist.controller';

const wishlists = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

wishlists.use('*', requireAuth);
registerWishlistRoutes(wishlists);

export default wishlists;

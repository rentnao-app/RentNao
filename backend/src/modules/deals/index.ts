import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { registerDealsRoutes } from './controllers/deals.controller.ts';
import { requireAuth } from '@/security';

const deals = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

// Apply auth middleware to all deals routes
deals.use('*', requireAuth);

registerDealsRoutes(deals);

export default deals;

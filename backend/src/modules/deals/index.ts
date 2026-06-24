import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { registerDealsRoutes } from './controllers/deals.controller.ts';
import { requireAuth } from '@/security';
import { errorHandler } from '@/middlewares/error-handler';

const deals = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

// Register error handler for this sub-router
deals.onError(errorHandler);

// Apply auth middleware to all deals routes
deals.use('*', requireAuth);

registerDealsRoutes(deals);

export default deals;

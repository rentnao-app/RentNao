import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { requireAuth } from '@/security';
import { registerRentalRequestRoutes } from './rental-requests.controller';

const rentalRequests = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

rentalRequests.use('*', requireAuth);
registerRentalRequestRoutes(rentalRequests);

export default rentalRequests;

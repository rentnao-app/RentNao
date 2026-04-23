import { OpenAPIHono } from '@hono/zod-openapi';
import { requireAdmin } from '../middlewares/admin-auth';
import { registerUserManagementRoutes } from './user.controller';
import { registerStatsRoutes } from './stats.controller';
import { registerKycRoutes } from './kyc.controller';
import { registerFeePolicyRoutes } from './fee-policy.controller';
import { registerListingRoutes } from './listing.controller';

const admin = new OpenAPIHono();

admin.use('*', ...requireAdmin);

registerUserManagementRoutes(admin);
registerStatsRoutes(admin);
registerKycRoutes(admin);
registerFeePolicyRoutes(admin);
registerListingRoutes(admin);

export default admin;

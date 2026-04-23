import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { requireAuth } from '@/security';
import { registerPropertyRoutes, registerPublicPropertyRoutes } from './property.controller';

const properties = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

registerPublicPropertyRoutes(properties);

properties.use('*', requireAuth);

registerPropertyRoutes(properties);

export default properties;
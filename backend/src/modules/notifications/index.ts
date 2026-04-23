import { OpenAPIHono } from '@hono/zod-openapi';
import { defaultValidationHook } from '@/config/openapi';
import { requireAuth } from '@/security';
import { registerNotificationRoutes } from './notifications.controller';

const notifications = new OpenAPIHono({
  defaultHook: defaultValidationHook,
});

notifications.use('*', requireAuth);
registerNotificationRoutes(notifications);

export default notifications;

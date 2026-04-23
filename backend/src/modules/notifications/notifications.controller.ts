import type { OpenAPIHono } from '@hono/zod-openapi';
import { AppError } from '@/errors/base';
import { listNotificationsRoute, markOneReadRoute, readAllRoute, unreadCountRoute } from './notifications.routes';
import {
  listNotificationsForUser,
  markAllReadForUser,
  markNotificationReadForUser,
  unreadCountForUser,
} from './notifications.service';

export function registerNotificationRoutes(app: OpenAPIHono) {
  app.openapi(listNotificationsRoute, async (c) => {
    const user = c.get('user');
    const { limit } = c.req.valid('query');
    const notifications = await listNotificationsForUser(user.userId, limit ?? 50);
    return c.json({ success: true, notifications }, 200);
  });

  app.openapi(markOneReadRoute, async (c) => {
    const user = c.get('user');
    const { notificationId } = c.req.valid('param');
    const updated = await markNotificationReadForUser(user.userId, notificationId);
    if (!updated) {
      throw new AppError(404, 'Notification not found');
    }
    return c.json({ success: true, updated: true }, 200);
  });

  app.openapi(unreadCountRoute, async (c) => {
    const user = c.get('user');
    const count = await unreadCountForUser(user.userId);
    return c.json({ success: true, count }, 200);
  });

  app.openapi(readAllRoute, async (c) => {
    const user = c.get('user');
    await markAllReadForUser(user.userId);
    return c.json({ success: true }, 200);
  });
}

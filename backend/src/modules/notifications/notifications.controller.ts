import type { OpenAPIHono } from '@hono/zod-openapi';
import { AppError } from '@/errors/base';
import {
  listNotificationsRoute,
  markOneReadRoute,
  readAllRoute,
  unreadCountRoute,
  subscribePushRoute,
  unsubscribePushRoute,
  adminBroadcastRoute,
} from './notifications.routes';
import {
  listNotificationsForUser,
  markAllReadForUser,
  markNotificationReadForUser,
  unreadCountForUser,
  createNotification,
  createBulkNotifications,
} from './notifications.service';
import { saveSubscription, removeSubscription } from './fcm.service';

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

  // Push Subscription Endpoints

  app.openapi(subscribePushRoute, async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    await saveSubscription({
      userId: user.userId,
      fcmToken: body.fcm_token,
      deviceName: body.device_name,
      browser: body.browser,
      platform: body.platform,
    });
    return c.json({ success: true }, 200);
  });

  app.openapi(unsubscribePushRoute, async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    await removeSubscription(user.userId, body.fcm_token);
    return c.json({ success: true }, 200);
  });

  // Admin Broadcast Endpoint

  app.openapi(adminBroadcastRoute, async (c) => {
    const user = c.get('user');

    // Only admins can broadcast
    if (user.role !== 'ADMIN') {
      throw new AppError(403, 'Forbidden: Admin access required');
    }

    const body = c.req.valid('json');

    // Determine target user IDs
    let targetUserIds: string[];
    if (body.user_ids && body.user_ids.length > 0) {
      targetUserIds = body.user_ids;
    } else {
      // Broadcast to all active users (optionally filtered by role)
      const { getAllActiveUserIds } = await import('./notifications.service');
      targetUserIds = await getAllActiveUserIds(body.target_role);
    }

    // Bulk pipeline: single DB insert → WebSocket broadcast → FCM multicast
    const { sent, failed } = await createBulkNotifications(
      targetUserIds,
      body.title,
      body.body,
      body.data
    );

    return c.json({ success: true, sent, failed }, 200);
  });
}

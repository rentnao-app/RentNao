import crypto from 'crypto';
import { db } from '@/db/client';

export type NotificationRow = {
  notification_id: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  created_at: string;
};

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  data?: Record<string, unknown>,
  sendPush: boolean = true
): Promise<void> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  await db.query(
    `INSERT INTO "Notification" (notification_id, user_id, title, message, data, is_read)
     VALUES ($1, $2, $3, $4, $5::jsonb, false)`,
    [id, userId, title, message, data == null ? null : JSON.stringify(data)]
  );

  // Push real-time notification via WebSocket (if user is connected)
  // Lazy import to avoid circular dependency (conversations → notifications → ws-registry)
  try {
    const { pushToUser } = await import('@/modules/conversations/ws/ws-registry');
    pushToUser(userId, {
      type: 'notification',
      notification: { id, title, message, data: data ?? null, createdAt },
    });
  } catch {
    // WebSocket module not loaded yet (startup) or import failed — silently skip
  }

  // Also send a push notification via FCM (if user has subscribed on any device)
  if (sendPush) {
    try {
      const { sendPushToUser } = await import('./fcm.service');
      // Fire-and-forget — don't block the response on push delivery
      sendPushToUser(userId, { title, body: message }).catch(() => { });
    } catch {
      // FCM module not loaded or not configured — silently skip
    }
  }
}

/**
 * Creates notifications for multiple users in bulk.
 * - Inserts all notification rows in a single SQL query using UNNEST
 * - Broadcasts via WebSocket to any connected users
 * - Triggers bulk FCM push using sendBulkPush (multicast)
 *
 * Use this for 1-to-Many scenarios (admin broadcasts, saved-search alerts, etc.)
 */
export async function createBulkNotifications(
  userIds: string[],
  title: string,
  message: string,
  data?: Record<string, unknown>,
  sendPush: boolean = true
): Promise<{ sent: number; failed: number }> {
  if (userIds.length === 0) return { sent: 0, failed: 0 };

  const dataJson = data == null ? null : JSON.stringify(data);

  // 1. Batch DB insert — single query for ALL users using UNNEST
  await db.query(
    `INSERT INTO "Notification" (notification_id, user_id, title, message, data, is_read)
     SELECT gen_random_uuid(), unnest($1::text[]), $2, $3, $4::jsonb, false`,
    [userIds, title, message, dataJson]
  );

  // 2. Push real-time WebSocket notifications to connected users (chunked to avoid blocking event loop)
  try {
    const { pushToUser } = await import('@/modules/conversations/ws/ws-registry');
    const createdAt = new Date().toISOString();
    const WS_CHUNK = 500;
    for (let i = 0; i < userIds.length; i += WS_CHUNK) {
      const chunk = userIds.slice(i, i + WS_CHUNK);
      for (const userId of chunk) {
        pushToUser(userId, {
          type: 'notification',
          notification: { id: null, title, message, data: data ?? null, createdAt },
        });
      }
      // Yield to the event loop so other requests aren't starved
      if (i + WS_CHUNK < userIds.length) {
        await new Promise<void>((resolve) => setImmediate(resolve));
      }
    }
  } catch {
    // WebSocket module not loaded yet (startup) or import failed — silently skip
  }

  // 3. Bulk FCM push — single token fetch + multicast in chunks of 500
  if (sendPush) {
    try {
      const { sendBulkPush } = await import('./fcm.service');
      const result = await sendBulkPush(userIds, { title, body: message });
      return { sent: result.sent, failed: result.failed };
    } catch {
      // FCM module not loaded or not configured — silently skip
    }
  }

  return { sent: userIds.length, failed: 0 };
}


export async function listNotificationsForUser(userId: string, limit: number): Promise<NotificationRow[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const r = await db.query(
    `SELECT notification_id, title, message, data, is_read, created_at
     FROM "Notification"
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, safeLimit]
  );
  return r.rows.map((row) => ({
    notification_id: row.notification_id as string,
    title: row.title as string,
    message: row.message as string,
    data: (row.data as Record<string, unknown> | null) ?? null,
    is_read: Boolean(row.is_read),
    created_at: (row.created_at as Date).toISOString(),
  }));
}

export async function unreadCountForUser(userId: string): Promise<number> {
  const r = await db.query(
    `SELECT COUNT(*)::int AS c FROM "Notification" WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return Number(r.rows[0]?.c ?? 0);
}

export async function markAllReadForUser(userId: string): Promise<void> {
  await db.query(`UPDATE "Notification" SET is_read = true WHERE user_id = $1 AND is_read = false`, [userId]);
}

/** Marks one notification read for the owner. Returns true if the notification exists for this user. */
export async function markNotificationReadForUser(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const r = await db.query(
    `UPDATE "Notification" SET is_read = true
     WHERE user_id = $1 AND notification_id = $2
     RETURNING notification_id`,
    [userId, notificationId]
  );
  return (r.rowCount ?? r.rows?.length ?? 0) > 0;
}

export async function getAllActiveUserIds(role?: string): Promise<string[]> {
  if (role) {
    const result = await db.query(`SELECT user_id FROM "User" WHERE deleted_at IS NULL AND role = $1`, [role]);
    return result.rows.map((r) => r.user_id as string);
  }
  const result = await db.query(`SELECT user_id FROM "User" WHERE deleted_at IS NULL`);
  return result.rows.map((r) => r.user_id as string);
}

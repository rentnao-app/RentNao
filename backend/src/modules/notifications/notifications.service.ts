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
  data?: Record<string, unknown>
): Promise<void> {
  const id = crypto.randomUUID();
  await db.query(
    `INSERT INTO "Notification" (notification_id, user_id, title, message, data, is_read)
     VALUES ($1, $2, $3, $4, $5::jsonb, false)`,
    [id, userId, title, message, data == null ? null : JSON.stringify(data)]
  );
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

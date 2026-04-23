import { db } from '@/db/client';
import { UserNotFoundError, SessionNotFoundError } from '@/errors';

export async function getUserSessions(userId: string) {
  const userResult = await db.query(`SELECT user_id FROM "User" WHERE user_id = $1`, [userId]);

  if (userResult.rows.length === 0) {
    throw new UserNotFoundError();
  }

  const sessionsResult = await db.query(
    `SELECT id, session_token, expires_at, ip_address, user_agent, last_activity, created_at
     FROM "Session"
     WHERE user_id = $1 AND expires_at > NOW()
     ORDER BY last_activity DESC`,
    [userId]
  );

  return sessionsResult.rows.map((s: any) => ({
    id: s.id,
    sessionToken: s.session_token,
    expiresAt: s.expires_at,
    ipAddress: s.ip_address,
    userAgent: s.user_agent,
    lastActivity: s.last_activity,
    createdAt: s.created_at,
  }));
}

export async function invalidateUserSessions(userId: string) {
  const userResult = await db.query(`SELECT user_id FROM "User" WHERE user_id = $1`, [userId]);

  if (userResult.rows.length === 0) {
    throw new UserNotFoundError();
  }

  await db.query(`DELETE FROM "Session" WHERE user_id = $1`, [userId]);

  return { success: true, message: 'All user sessions invalidated successfully' };
}

export async function invalidateSession(sessionId: string) {
  const result = await db.query(`DELETE FROM "Session" WHERE id = $1 RETURNING id`, [sessionId]);

  if (result.rows.length === 0) {
    throw new SessionNotFoundError();
  }

  return { success: true, message: 'Session invalidated successfully' };
}

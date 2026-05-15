/**
 * Scheduled Jobs
 *
 * Lightweight cron-like scheduler using setInterval.
 * No external dependencies needed — Bun's event loop handles it.
 *
 * Jobs:
 *   1. closeExpiredConversations — Runs every hour, closes ACCEPTED conversations past their expires_at
 */

import { db } from '@/db/client';

const ONE_HOUR_MS = 60 * 60 * 1000;

let expiryTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Close all conversations that have passed their expiry date.
 * This ensures data consistency even if no one ever views the conversation again.
 */
async function closeExpiredConversations(): Promise<void> {
  try {
    const result = await db.query(
      `UPDATE "Conversation"
       SET status = 'CLOSED', closed_at = expires_at, closed_by = NULL, updated_at = NOW()
       WHERE status = 'ACCEPTED' AND expires_at < NOW()`
    );

    const count = result.rowCount ?? 0;
    if (count > 0) {
      console.log(`[Cron] Closed ${count} expired conversation(s)`);
    }
  } catch (err: any) {
    console.error('[Cron] Failed to close expired conversations:', err.message);
  }
}

/**
 * Start all scheduled jobs. Call once at server startup.
 */
export function startScheduledJobs(): void {
  // Run once immediately on startup to clean up any backlog
  closeExpiredConversations();

  // Then run every hour
  expiryTimer = setInterval(closeExpiredConversations, ONE_HOUR_MS);
  console.log('[Cron] Scheduled jobs started (conversation expiry: every 1h)');
}

/**
 * Stop all scheduled jobs. Called during graceful shutdown.
 */
export function stopScheduledJobs(): void {
  if (expiryTimer) {
    clearInterval(expiryTimer);
    expiryTimer = null;
    console.log('[Cron] Scheduled jobs stopped');
  }
}

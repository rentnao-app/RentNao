/**
 * Firebase Cloud Messaging (FCM) Service
 *
 * Handles:
 * - Firebase Admin SDK initialization
 * - Saving/updating push subscription tokens
 * - Sending push notifications to individual users
 * - Broadcasting push notifications to multiple users
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { env } from '@/config/env';
import { db } from '@/db/client';

// Firebase Admin SDK Initialization

let firebaseInitialized = false;

function initializeFirebase(): boolean {
  if (firebaseInitialized) return true;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('[FCM] Firebase credentials not configured — push notifications disabled');
    return false;
  }

  try {
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        // The private key comes from .env with literal \n, so we need to replace them
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    console.log('[FCM] Firebase Admin SDK initialized successfully');
    return true;
  } catch (err: any) {
    console.error('[FCM] Failed to initialize Firebase Admin SDK:', err.message);
    return false;
  }
}

// Initialize on module load
initializeFirebase();

// Subscription Management

export interface SaveSubscriptionInput {
  userId: string;
  fcmToken: string;
  deviceName?: string;
  browser?: string;
  platform?: string;
}

/**
 * Saves or updates an FCM push subscription token for a user.
 * If the token already exists, it updates the user_id and metadata
 * (handles the case where a different user logs in on the same browser).
 */
export async function saveSubscription(input: SaveSubscriptionInput): Promise<void> {
  const { userId, fcmToken, deviceName, browser, platform } = input;

  await db.query(
    `INSERT INTO "PushSubscription" (id, user_id, fcm_token, device_name, browser, platform)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
     ON CONFLICT (fcm_token)
     DO UPDATE SET
       user_id = EXCLUDED.user_id,
       device_name = COALESCE(EXCLUDED.device_name, "PushSubscription".device_name),
       browser = COALESCE(EXCLUDED.browser, "PushSubscription".browser),
       platform = COALESCE(EXCLUDED.platform, "PushSubscription".platform),
       last_active_at = NOW()`,
    [userId, fcmToken, deviceName ?? null, browser ?? null, platform ?? null]
  );
}

/**
 * Removes an FCM token (e.g., when user logs out or explicitly unsubscribes).
 */
export async function removeSubscription(userId: string, fcmToken: string): Promise<void> {
  await db.query(
    `DELETE FROM "PushSubscription" WHERE user_id = $1 AND fcm_token = $2`,
    [userId, fcmToken]
  );
}

// Sending Push Notifications

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Sends a push notification to all active devices of a specific user.
 * Automatically cleans up invalid/expired tokens.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!firebaseInitialized) return;

  // Fetch all active FCM tokens for this user
  const result = await db.query(
    `SELECT fcm_token FROM "PushSubscription"
     WHERE user_id = $1 AND notification_enabled = true`,
    [userId]
  );

  const tokens: string[] = result.rows.map((r) => r.fcm_token as string);
  if (tokens.length === 0) return;

  const { getMessaging } = await import('firebase-admin/messaging');
  const messaging = getMessaging();
  const invalidTokens: string[] = [];

  // Send to each token individually so we can track which ones fail
  const sendPromises = tokens.map(async (token) => {
    try {
      await messaging.send({
        token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        // Web push specific config
        webpush: {
          notification: {
            icon: '/icons/icon-192x192.png',
          },
          fcmOptions: {
            link: '/',
          },
        },
      });

      // Update last_active_at on successful send
      await db.query(
        `UPDATE "PushSubscription" SET last_active_at = NOW() WHERE fcm_token = $1`,
        [token]
      );
    } catch (err: any) {
      // Token is invalid or unregistered — mark for cleanup
      if (
        err.code === 'messaging/registration-token-not-registered' ||
        err.code === 'messaging/invalid-registration-token'
      ) {
        invalidTokens.push(token);
      } else {
        console.error(`[FCM] Failed to send to token ${token.slice(0, 10)}...:`, err.message);
      }
    }
  });

  await Promise.allSettled(sendPromises);

  // Cleanup invalid tokens
  if (invalidTokens.length > 0) {
    const placeholders = invalidTokens.map((_, i) => `$${i + 1}`).join(', ');
    await db.query(
      `DELETE FROM "PushSubscription" WHERE fcm_token IN (${placeholders})`,
      invalidTokens
    );
    console.log(`[FCM] Cleaned up ${invalidTokens.length} invalid token(s)`);
  }
}


/**
 * Sends push notifications to multiple users in bulk using FCM Multicast.
 * - Fetches all tokens for all target users in a single DB query
 * - Sends in chunks of 500 (FCM Multicast limit)
 * - Cleans up all invalid/expired tokens in a single bulk DELETE
 */
export async function sendBulkPush(userIds: string[], payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!firebaseInitialized || userIds.length === 0) return { sent: 0, failed: 0 };

  // 1. Batch token fetch — single query for ALL target users
  const result = await db.query(
    `SELECT fcm_token FROM "PushSubscription"
     WHERE user_id = ANY($1) AND notification_enabled = true`,
    [userIds]
  );

  const tokens: string[] = result.rows.map((r) => r.fcm_token as string);
  if (tokens.length === 0) return { sent: 0, failed: 0 };

  const { getMessaging } = await import('firebase-admin/messaging');
  const messaging = getMessaging();

  let totalSent = 0;
  let totalFailed = 0;
  const invalidTokens: string[] = [];

  // 2. Chunk tokens into groups of 500 (FCM batch limit)
  const CHUNK_SIZE = 500;
  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const chunk = tokens.slice(i, i + CHUNK_SIZE);

    // Build individual message objects for sendEach
    const messages = chunk.map((token) => ({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
      webpush: {
        notification: {
          icon: '/icons/icon-192x192.png',
        },
        fcmOptions: {
          link: '/',
        },
      },
    }));

    const response = await messaging.sendEach(messages);

    totalSent += response.successCount;
    totalFailed += response.failureCount;

    // Identify invalid tokens from the response
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        console.error(`[FCM] Error for token ${chunk[idx]}:`, resp.error.code);
        if (
          resp.error.code === 'messaging/registration-token-not-registered' ||
          resp.error.code === 'messaging/invalid-registration-token' ||
          resp.error.code === 'messaging/invalid-argument'
        ) {
          invalidTokens.push(chunk[idx]!);
        }
      }
    });
  }

  // 3. Bulk cleanup of all invalid tokens in a single DELETE
  if (invalidTokens.length > 0) {
    await db.query(
      `DELETE FROM "PushSubscription" WHERE fcm_token = ANY($1)`,
      [invalidTokens]
    );
    console.log(`[FCM] Cleaned up ${invalidTokens.length} invalid token(s)`);
  }

  console.log(`[FCM] Bulk push complete: ${totalSent} sent, ${totalFailed} failed across ${tokens.length} token(s)`);
  return { sent: totalSent, failed: totalFailed };
}

/**
 * Returns all distinct user IDs that have active push subscriptions.
 */
export async function getAllPushSubscribedUserIds(): Promise<string[]> {
  const result = await db.query(
    `SELECT DISTINCT user_id FROM "PushSubscription" WHERE notification_enabled = true`
  );
  return result.rows.map((r) => r.user_id as string);
}


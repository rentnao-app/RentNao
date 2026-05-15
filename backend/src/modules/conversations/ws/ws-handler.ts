/**
 * WebSocket handler for real-time chat and notifications
 *
 * Connection: ws://host/ws?token=<JWT>
 *
 * Client → Server:
 *   { type: "join",    conversationId: string }
 *   { type: "leave",   conversationId: string }
 *   { type: "message", conversationId: string, content: string }
 *   { type: "ping" }
 *
 * Server → Client:
 *   { type: "message",             conversationId, message: {...} }
 *   { type: "conversation_status", conversationId, status, expiresAt? }
 *   { type: "notification",        notification: {...} }
 *   { type: "error",               code, reason }
 *   { type: "pong" }
 */

import type { WSContext, WSMessageReceive } from 'hono/ws';
import { verifyAccessToken } from '@/security/jwt';
import { db } from '@/db/client';
import {
  addConnection,
  removeConnection,
  joinRoom,
  leaveRoom,
  broadcastToRoom,
  pushToUser,
  isUserInRoom,
} from './ws-registry';
import { sendMessage } from '../services/conversation.service';
import { createNotification } from '@/modules/notifications/notifications.service';

// Re-export pushToUser for use by notification service
export { pushToUser } from './ws-registry';

// ============================================================================
// WebSocket Handler Factory (used by upgradeWebSocket)
// ============================================================================

/**
 * Creates WebSocket event handlers for a connection.
 * Called by Hono's upgradeWebSocket middleware.
 */
export function chatWebSocketHandler(c: any) {
  // Extract JWT token from query param
  const url = new URL(c.req.url);
  const token = url.searchParams.get('token');

  let userId: string | null = null;

  return {
    onOpen(_event: Event, ws: WSContext) {
      if (!token) {
        sendError(ws, 'AUTH_REQUIRED', 'Missing token query parameter');
        ws.close(1008, 'Missing token');
        return;
      }

      try {
        const payload = verifyAccessToken(token);
        userId = payload.userId;
        addConnection(userId, ws);
        console.log(`[WS] User ${userId} connected`);
      } catch (err: any) {
        const reason = err.message?.includes('expired')
          ? 'Token expired'
          : 'Invalid token';
        sendError(ws, 'AUTH_FAILED', reason);
        ws.close(1008, reason);
      }
    },

    async onMessage(event: MessageEvent<WSMessageReceive>, ws: WSContext) {
      if (!userId) return;

      let data: any;
      try {
        const raw = typeof event.data === 'string' ? event.data : event.data.toString();
        data = JSON.parse(raw);
      } catch {
        sendError(ws, 'INVALID_JSON', 'Could not parse message as JSON');
        return;
      }

      const { type } = data;

      switch (type) {
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;

        case 'join':
          await handleJoin(userId, data.conversationId, ws);
          break;

        case 'leave':
          handleLeave(data.conversationId, ws);
          break;

        case 'message':
          await handleMessage(userId, data.conversationId, data.content, ws);
          break;

        default:
          sendError(ws, 'UNKNOWN_TYPE', `Unknown message type: ${type}`);
      }
    },

    onClose(_event: CloseEvent, ws: WSContext) {
      if (userId) {
        console.log(`[WS] User ${userId} disconnected`);
        removeConnection(ws);
      }
    },

    onError(event: Event, ws: WSContext) {
      console.error(`[WS] Error for user ${userId}:`, event);
      if (userId) {
        removeConnection(ws);
      }
    },
  };
}

// ============================================================================
// Message Handlers
// ============================================================================

async function handleJoin(userId: string, conversationId: string | undefined, ws: WSContext) {
  if (!conversationId) {
    sendError(ws, 'MISSING_FIELD', 'conversationId is required');
    return;
  }

  // Verify user is a participant in this conversation
  const result = await db.query(
    `SELECT tenant_user_id, owner_user_id, status, expires_at
     FROM "Conversation"
     WHERE id = $1
     LIMIT 1`,
    [conversationId]
  );

  if (result.rows.length === 0) {
    sendError(ws, 'NOT_FOUND', 'Conversation not found');
    return;
  }

  const conv = result.rows[0];
  if (conv.tenant_user_id !== userId && conv.owner_user_id !== userId) {
    sendError(ws, 'FORBIDDEN', 'You are not a participant in this conversation');
    return;
  }

  joinRoom(conversationId, userId, ws);

  ws.send(JSON.stringify({
    type: 'joined',
    conversationId,
    status: conv.status,
    expiresAt: conv.expires_at ? new Date(conv.expires_at).toISOString() : null,
  }));
}

function handleLeave(conversationId: string | undefined, ws: WSContext) {
  if (!conversationId) {
    sendError(ws, 'MISSING_FIELD', 'conversationId is required');
    return;
  }

  leaveRoom(conversationId, ws);

  ws.send(JSON.stringify({
    type: 'left',
    conversationId,
  }));
}

async function handleMessage(
  userId: string,
  conversationId: string | undefined,
  content: string | undefined,
  ws: WSContext
) {
  if (!conversationId) {
    sendError(ws, 'MISSING_FIELD', 'conversationId is required');
    return;
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    sendError(ws, 'MISSING_FIELD', 'content is required and must be non-empty');
    return;
  }

  try {
    // Delegate to the service (handles all validation: access, status, expiry, content filter, sanitize)
    const message = await sendMessage(userId, conversationId, content);

    // Send confirmation to the sender (all their tabs)
    pushToUser(userId, {
      type: 'message',
      conversationId,
      message,
    });

    // Broadcast to other participants in the room (all their tabs)
    broadcastToRoom(conversationId, {
      type: 'message',
      conversationId,
      message,
    }, userId);

    // If recipient is NOT in the room, send them an in-app notification
    const convResult = await db.query(
      `SELECT tenant_user_id, owner_user_id FROM "Conversation" WHERE id = $1`,
      [conversationId]
    );

    if (convResult.rows.length > 0) {
      const conv = convResult.rows[0];
      const recipientId = userId === conv.tenant_user_id
        ? conv.owner_user_id
        : conv.tenant_user_id;

      if (!isUserInRoom(conversationId, recipientId)) {
        // Recipient is not actively viewing this conversation — send notification
        // (createNotification will also push via WebSocket if they're connected)
        await createNotification(
          recipientId,
          'New message',
          content.length > 100 ? content.substring(0, 100) + '...' : content,
          {
            conversation_id: conversationId,
            sender_user_id: userId,
            url: `/conversations/${conversationId}`,
          }
        );
      }
    }
  } catch (err: any) {
    sendError(ws, 'MESSAGE_FAILED', err.message || 'Failed to send message');
  }
}

// ============================================================================
// Helpers
// ============================================================================

function sendError(ws: WSContext, code: string, reason: string) {
  try {
    ws.send(JSON.stringify({ type: 'error', code, reason }));
  } catch {
    // Connection already dead
  }
}

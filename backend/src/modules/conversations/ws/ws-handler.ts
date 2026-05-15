/**
 * WebSocket handler for real-time chat and notifications
 *
 * Connection flow (ticket-based auth):
 *   1. Client calls POST /conversations/ws-ticket (with Bearer JWT)
 *   2. Server returns { ticket: "abc-123" } (valid for 30 seconds, single-use)
 *   3. Client connects: ws://host/ws?ticket=abc-123
 *   4. Server consumes ticket from Redis, authenticates user
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
import { consumeWsTicket } from './ws-ticket';
import { sendMessage } from '../services/conversation.service';
import { createNotification } from '@/modules/notifications/notifications.service';

// Re-export pushToUser for use by notification service
export { pushToUser } from './ws-registry';


// Rate Limiting (in-memory sliding window per user per conversation)

const MESSAGE_RATE_WINDOW_MS = 10_000; // 10 seconds
const MESSAGE_RATE_MAX = 10;           // max 10 messages per window

// userId → { conversationId → timestamp[] }
const messageTimestamps = new Map<string, Map<string, number[]>>();

function isRateLimited(userId: string, conversationId: string): boolean {
  const now = Date.now();
  const cutoff = now - MESSAGE_RATE_WINDOW_MS;

  let userMap = messageTimestamps.get(userId);
  if (!userMap) {
    userMap = new Map();
    messageTimestamps.set(userId, userMap);
  }

  let timestamps = userMap.get(conversationId);
  if (!timestamps) {
    timestamps = [];
    userMap.set(conversationId, timestamps);
  }

  // Prune expired timestamps
  const filtered = timestamps.filter(t => t > cutoff);
  userMap.set(conversationId, filtered);

  if (filtered.length >= MESSAGE_RATE_MAX) {
    return true;
  }

  filtered.push(now);
  return false;
}

// Clean up rate limit data when connection drops
function cleanupRateLimitData(userId: string): void {
  messageTimestamps.delete(userId);
}


// Input Validation

const MAX_ID_LENGTH = 128;
const MAX_CONTENT_LENGTH = 2000;

function isValidId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= MAX_ID_LENGTH;
}


// WebSocket Handler Factory (used by upgradeWebSocket)

/**
 * Creates WebSocket event handlers for a connection.
 * Called by Hono's upgradeWebSocket middleware.
 *
 * Authentication is now ticket-based:
 *   ws://host/ws?ticket=<single-use-ticket>
 * The ticket is consumed from Redis on connection open.
 */
export function chatWebSocketHandler(c: any) {
  // Extract ticket from query param (NOT a JWT — single-use, short-lived)
  const url = new URL(c.req.url);
  const ticket = url.searchParams.get('ticket');

  let userId: string | null = null;

  return {
    async onOpen(_event: Event, ws: WSContext) {
      if (!ticket) {
        sendError(ws, 'AUTH_REQUIRED', 'Missing ticket query parameter. Call POST /conversations/ws-ticket first.');
        ws.close(1008, 'Missing ticket');
        return;
      }

      try {
        // Consume the ticket (single-use — deleted from Redis on first read)
        const ticketData = await consumeWsTicket(ticket);
        if (!ticketData) {
          sendError(ws, 'AUTH_FAILED', 'Invalid or expired ticket. Request a new one via POST /conversations/ws-ticket.');
          ws.close(1008, 'Invalid ticket');
          return;
        }

        userId = ticketData.userId;
        addConnection(userId, ws);
        console.log(`[WS] User ${userId} connected (ticket auth)`);
      } catch (err: any) {
        sendError(ws, 'AUTH_FAILED', 'Ticket verification failed');
        ws.close(1008, 'Auth failed');
      }
    },

    async onMessage(event: MessageEvent<WSMessageReceive>, ws: WSContext) {
      if (!userId) return;

      let data: any;
      try {
        const raw = typeof event.data === 'string' ? event.data : event.data.toString();

        // Guard against excessively large payloads
        if (raw.length > MAX_CONTENT_LENGTH + 500) {
          sendError(ws, 'PAYLOAD_TOO_LARGE', 'Message payload exceeds maximum size');
          return;
        }

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
        cleanupRateLimitData(userId);
        removeConnection(ws);
      }
    },

    onError(event: Event, ws: WSContext) {
      console.error(`[WS] Error for user ${userId}:`, event);
      if (userId) {
        cleanupRateLimitData(userId);
        removeConnection(ws);
      }
    },
  };
}


// Message Handlers

async function handleJoin(userId: string, conversationId: unknown, ws: WSContext) {
  if (!isValidId(conversationId)) {
    sendError(ws, 'INVALID_INPUT', 'conversationId must be a non-empty string');
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

function handleLeave(conversationId: unknown, ws: WSContext) {
  if (!isValidId(conversationId)) {
    sendError(ws, 'INVALID_INPUT', 'conversationId must be a non-empty string');
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
  conversationId: unknown,
  content: unknown,
  ws: WSContext
) {
  if (!isValidId(conversationId)) {
    sendError(ws, 'INVALID_INPUT', 'conversationId must be a non-empty string');
    return;
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    sendError(ws, 'MISSING_FIELD', 'content is required and must be non-empty');
    return;
  }
  if (content.length > MAX_CONTENT_LENGTH) {
    sendError(ws, 'PAYLOAD_TOO_LARGE', `content cannot exceed ${MAX_CONTENT_LENGTH} characters`);
    return;
  }

  // Rate limit check
  if (isRateLimited(userId, conversationId)) {
    sendError(ws, 'RATE_LIMITED', 'You are sending messages too fast. Please slow down.');
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
        // Use SANITIZED content from the service response, not raw input
        const preview = message.content.length > 100
          ? message.content.substring(0, 100) + '...'
          : message.content;

        await createNotification(
          recipientId,
          'New message',
          preview,
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


// Helpers

function sendError(ws: WSContext, code: string, reason: string) {
  try {
    ws.send(JSON.stringify({ type: 'error', code, reason }));
  } catch {
    // Connection already dead
  }
}

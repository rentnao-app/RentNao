import { OpenAPIHono } from '@hono/zod-openapi';
import { requireAuth } from '@/security';
import * as routes from '../routes/conversation.routes';
import * as service from '../services/conversation.service';
import { createWsTicket } from '../ws/ws-ticket';
import { db } from '@/db/client';
import { AppError } from '@/errors';
import {
  pushToUser,
  broadcastToRoom,
  isUserInRoom,
  isRateLimited,
} from '../ws/ws-registry';
import { createNotification } from '@/modules/notifications/notifications.service';

const app = new OpenAPIHono();

// All conversation routes require authentication
app.use('*', requireAuth);

// GET /conversations
app.openapi(routes.listConversationsRoute, async (c) => {
  const user = c.get('user');
  const query = c.req.valid('query');

  const result = await service.listConversations(user.userId, user.role, query);

  return c.json({
    success: true,
    data: result.conversations,
    meta: result.pagination,
  }, 200);
});

// GET /conversations/:conversationId
app.openapi(routes.getConversationRoute, async (c) => {
  const user = c.get('user');
  const { conversationId } = c.req.valid('param');

  const conversation = await service.getConversation(user.userId, conversationId);

  return c.json({
    success: true,
    data: conversation,
  }, 200);
});

// PATCH /conversations/:conversationId/accept
app.openapi(routes.acceptConversationRoute, async (c) => {
  const user = c.get('user');
  const { conversationId } = c.req.valid('param');

  const conversation = await service.acceptConversation(user.userId, conversationId);

  // Broadcast status update to all open tabs of both participants
  const statusPayload = {
    type: 'conversation_status',
    conversationId,
    status: conversation.status,
    expiresAt: conversation.expiresAt,
  };
  pushToUser(conversation.tenantUserId, statusPayload);
  pushToUser(conversation.ownerUserId, statusPayload);

  return c.json({
    success: true,
    data: conversation,
    message: 'Conversation accepted. You can now message freely for 30 days.',
  }, 200);
});

// PATCH /conversations/:conversationId/close
app.openapi(routes.closeConversationRoute, async (c) => {
  const user = c.get('user');
  const { conversationId } = c.req.valid('param');

  const conversation = await service.closeConversation(user.userId, conversationId);

  // Broadcast status update to all open tabs of both participants
  const statusPayload = {
    type: 'conversation_status',
    conversationId,
    status: conversation.status,
    expiresAt: conversation.expiresAt,
  };
  pushToUser(conversation.tenantUserId, statusPayload);
  pushToUser(conversation.ownerUserId, statusPayload);

  return c.json({
    success: true,
    data: conversation,
    message: 'Conversation closed.',
  }, 200);
});

// GET /conversations/:conversationId/messages
app.openapi(routes.getMessagesRoute, async (c) => {
  const user = c.get('user');
  const { conversationId } = c.req.valid('param');
  const query = c.req.valid('query');

  const result = await service.getMessages(user.userId, conversationId, query);

  return c.json({
    success: true,
    data: result.messages,
    meta: {
      hasMore: result.hasMore,
      nextCursor: result.nextCursor,
    },
  }, 200);
});

// POST /conversations/:conversationId/messages (REST fallback)
app.openapi(routes.sendMessageRoute, async (c) => {
  const user = c.get('user');
  const { conversationId } = c.req.valid('param');
  const { content } = c.req.valid('json');

  // Enforce same rate limit as WebSockets
  if (isRateLimited(user.userId, conversationId)) {
    throw new AppError(429, 'You are sending messages too fast. Please slow down.');
  }

  const message = await service.sendMessage(user.userId, conversationId, content);

  // Send real-time updates over WebSocket
  // 1. Push message confirmation to all of sender's open tabs
  pushToUser(user.userId, {
    type: 'message',
    conversationId,
    message,
  });

  // 2. Broadcast message to other active participants in the conversation room
  broadcastToRoom(conversationId, {
    type: 'message',
    conversationId,
    message,
  }, user.userId);

  // 3. Send in-app notification if the recipient is not active in the WS room
  const convResult = await db.query(
    `SELECT tenant_user_id, owner_user_id FROM "Conversation" WHERE id = $1`,
    [conversationId]
  );

  if (convResult.rows.length > 0) {
    const conv = convResult.rows[0];
    const recipientId = user.userId === conv.tenant_user_id
      ? conv.owner_user_id
      : conv.tenant_user_id;

    if (!isUserInRoom(conversationId, recipientId)) {
      const preview = message.content.length > 100
        ? message.content.substring(0, 100) + '...'
        : message.content;

      await createNotification(
        recipientId,
        'New message',
        preview,
        {
          conversation_id: conversationId,
          sender_user_id: user.userId,
          url: `/chats/${conversationId}`,
        }
      );
    }
  }

  return c.json({
    success: true,
    data: message,
  }, 201);
});

// POST /conversations/ws-ticket — Generate a single-use WebSocket ticket
app.openapi(routes.createWsTicketRoute, async (c) => {
  const user = c.get('user');
  const ticket = await createWsTicket(user.userId, user.role);

  return c.json({
    success: true,
    data: { ticket },
    message: 'WebSocket ticket issued. Use within 30 seconds.',
  }, 201);
});

export default app;

import { OpenAPIHono } from '@hono/zod-openapi';
import { requireAuth } from '@/security/middlewares/auth';
import * as routes from '../routes/conversation.routes';
import * as service from '../services/conversation.service';
import { createWsTicket } from '../ws/ws-ticket';

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

  const message = await service.sendMessage(user.userId, conversationId, content);

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

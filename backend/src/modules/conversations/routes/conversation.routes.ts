/**
 * Conversation REST routes (OpenAPI)
 */

import { createRoute } from '@hono/zod-openapi';
import { z } from '@hono/zod-openapi';
import {
  conversationResponseSchema,
  conversationsListResponseSchema,
  messagesListResponseSchema,
  messageResponseSchema,
  errorResponseSchema,
  listConversationsQuerySchema,
  getMessagesQuerySchema,
  sendMessageInputSchema,
} from '../schemas';

const TAG = 'Conversations';

function errorResponse(status: number, description: string) {
  return {
    [status]: {
      description,
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  };
}

// GET /conversations
export const listConversationsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: [TAG],
  summary: 'List my conversations',
  description: 'List conversations for the authenticated user (tenant or owner). Supports filtering by status.',
  security: [{ bearerAuth: [] }],
  request: {
    query: listConversationsQuerySchema,
  },
  responses: {
    200: {
      description: 'Conversations list with pagination',
      content: { 'application/json': { schema: conversationsListResponseSchema } },
    },
    ...errorResponse(401, 'Unauthorized'),
  },
});

// GET /conversations/:conversationId
export const getConversationRoute = createRoute({
  method: 'get',
  path: '/{conversationId}',
  tags: [TAG],
  summary: 'Get conversation details',
  description: 'Get a single conversation. Only participants can view.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      conversationId: z.string().openapi({ description: 'Conversation ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Conversation details',
      content: { 'application/json': { schema: conversationResponseSchema } },
    },
    ...errorResponse(403, 'Not a participant'),
    ...errorResponse(404, 'Conversation not found'),
  },
});

// PATCH /conversations/:conversationId/accept
export const acceptConversationRoute = createRoute({
  method: 'patch',
  path: '/{conversationId}/accept',
  tags: [TAG],
  summary: 'Accept a conversation (owner only)',
  description: 'Owner accepts a PENDING conversation. Sets status to ACCEPTED and starts the 30-day timer.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      conversationId: z.string().openapi({ description: 'Conversation ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Conversation accepted',
      content: { 'application/json': { schema: conversationResponseSchema } },
    },
    ...errorResponse(400, 'Invalid status transition'),
    ...errorResponse(403, 'Not the owner'),
    ...errorResponse(404, 'Conversation not found'),
  },
});

// PATCH /conversations/:conversationId/close
export const closeConversationRoute = createRoute({
  method: 'patch',
  path: '/{conversationId}/close',
  tags: [TAG],
  summary: 'Close a conversation',
  description: 'Either party can close a conversation. Sets status to CLOSED.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      conversationId: z.string().openapi({ description: 'Conversation ID' }),
    }),
  },
  responses: {
    200: {
      description: 'Conversation closed',
      content: { 'application/json': { schema: conversationResponseSchema } },
    },
    ...errorResponse(403, 'Not a participant'),
    ...errorResponse(404, 'Conversation not found'),
  },
});

// GET /conversations/:conversationId/messages
export const getMessagesRoute = createRoute({
  method: 'get',
  path: '/{conversationId}/messages',
  tags: [TAG],
  summary: 'Get conversation messages',
  description: 'Cursor-based paginated messages. Returns newest first. Only participants can read.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      conversationId: z.string().openapi({ description: 'Conversation ID' }),
    }),
    query: getMessagesQuerySchema,
  },
  responses: {
    200: {
      description: 'Messages list',
      content: { 'application/json': { schema: messagesListResponseSchema } },
    },
    ...errorResponse(403, 'Not a participant'),
    ...errorResponse(404, 'Conversation not found'),
  },
});

// POST /conversations/:conversationId/messages
export const sendMessageRoute = createRoute({
  method: 'post',
  path: '/{conversationId}/messages',
  tags: [TAG],
  summary: 'Send a message (REST fallback)',
  description: 'Send a message via REST. Primarily used as a WebSocket fallback. Subject to content filtering and one-message gate.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      conversationId: z.string().openapi({ description: 'Conversation ID' }),
    }),
    body: {
      content: { 'application/json': { schema: sendMessageInputSchema } },
    },
  },
  responses: {
    201: {
      description: 'Message sent',
      content: { 'application/json': { schema: messageResponseSchema } },
    },
    ...errorResponse(400, 'Content blocked or empty'),
    ...errorResponse(403, 'Not allowed to send'),
    ...errorResponse(404, 'Conversation not found'),
  },
});

// POST /conversations/ws-ticket
export const createWsTicketRoute = createRoute({
  method: 'post',
  path: '/ws-ticket',
  tags: [TAG],
  summary: 'Generate a WebSocket ticket',
  description: 'Generates a single-use, 30-second ticket for authenticating a WebSocket connection. Use the ticket in the query string: ws://host/ws?ticket=<ticket>',
  security: [{ bearerAuth: [] }],
  responses: {
    201: {
      description: 'Ticket issued',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
            data: z.object({
              ticket: z.string().openapi({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' }),
            }),
            message: z.string().optional(),
          }),
        },
      },
    },
    ...errorResponse(401, 'Unauthorized'),
  },
});

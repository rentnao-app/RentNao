/**
 * Conversation Zod schemas
 * Input/output validation for conversation and message endpoints
 */

import { z } from '@hono/zod-openapi';
import { ConversationStatus } from '@/types/enums';

// Conversation Schemas

export const conversationSchema = z.object({
  conversationId: z.string().openapi({
    example: 'cm4conv123xyz',
    description: 'Conversation ID',
  }),
  propertyId: z.string().openapi({
    example: 'cm4prop123xyz',
    description: 'Property ID this conversation is about',
  }),
  tenantUserId: z.string().openapi({
    example: 'cm4user_tenant',
    description: 'Tenant user ID',
  }),
  ownerUserId: z.string().openapi({
    example: 'cm4user_owner',
    description: 'Owner user ID',
  }),
  status: ConversationStatus.openapi({
    example: 'PENDING',
    description: 'Conversation status',
  }),
  expiresAt: z.iso.datetime().nullable().openapi({
    example: '2026-06-14T12:00:00Z',
    description: 'Conversation expiry timestamp (set when ACCEPTED)',
  }),
  createdAt: z.iso.datetime().openapi({
    example: '2026-05-14T12:00:00Z',
    description: 'Conversation creation timestamp',
  }),
  closedAt: z.iso.datetime().nullable().openapi({
    example: null,
    description: 'When the conversation was closed',
  }),
  closedBy: z.string().nullable().openapi({
    example: null,
    description: 'User ID of who closed the conversation',
  }),
  property: z.object({
    title: z.string().openapi({ example: 'Spacious 3BR in Dhanmondi' }),
    areaName: z.string().openapi({ example: 'DHANMONDI' }),
  }).optional().openapi({
    description: 'Property summary (included in list views)',
  }),
  otherParty: z.object({
    userId: z.string().openapi({ example: 'cm4user_other' }),
    displayName: z.string().openapi({ example: 'Rafiq Ahmed' }),
  }).optional().openapi({
    description: 'The other participant in the conversation',
  }),
  lastMessage: z.object({
    content: z.string().openapi({ example: 'Hi, is this available?' }),
    createdAt: z.iso.datetime().openapi({ example: '2026-05-14T12:05:00Z' }),
    senderId: z.string().openapi({ example: 'cm4user_tenant' }),
  }).nullable().optional().openapi({
    description: 'Most recent message preview',
  }),
  unreadCount: z.number().int().optional().openapi({
    example: 2,
    description: 'Unread message count for the requesting user',
  }),
});

export type ConversationType = z.infer<typeof conversationSchema>;

// Message Schemas

export const messageSchema = z.object({
  messageId: z.string().openapi({
    example: 'cm4msg123xyz',
    description: 'Message ID',
  }),
  conversationId: z.string().openapi({
    example: 'cm4conv123xyz',
    description: 'Conversation ID',
  }),
  senderId: z.string().openapi({
    example: 'cm4user_tenant',
    description: 'Sender user ID',
  }),
  content: z.string().openapi({
    example: 'Hi, is this apartment still available?',
    description: 'Message text content',
  }),
  createdAt: z.iso.datetime().openapi({
    example: '2026-05-14T12:05:00Z',
    description: 'Message creation timestamp',
  }),
});

export type MessageType = z.infer<typeof messageSchema>;

export const sendMessageInputSchema = z.object({
  content: z.string().min(1).max(2000).openapi({
    example: 'Hi, is this apartment still available?',
    description: 'Message text (1-2000 characters)',
  }),
});

export type SendMessageInput = z.infer<typeof sendMessageInputSchema>;

// Query / Filter Schemas

export const listConversationsQuerySchema = z.object({
  status: ConversationStatus.optional().openapi({
    description: 'Filter by conversation status',
  }),
  page: z.coerce.number().int().min(1).default(1).openapi({
    example: 1,
    description: 'Page number',
  }),
  limit: z.coerce.number().int().min(1).max(50).default(20).openapi({
    example: 20,
    description: 'Items per page',
  }),
});

export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;

export const getMessagesQuerySchema = z.object({
  cursor: z.string().optional().openapi({
    description: 'Cursor (message ID) for pagination — returns messages BEFORE this ID',
  }),
  limit: z.coerce.number().int().min(1).max(100).default(50).openapi({
    example: 50,
    description: 'Number of messages to fetch',
  }),
});

export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;


// Response Schemas


export const conversationResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: conversationSchema,
  message: z.string().optional(),
});

export const conversationsListResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.array(conversationSchema),
  meta: z.object({
    page: z.number().openapi({ example: 1 }),
    limit: z.number().openapi({ example: 20 }),
    total: z.number().openapi({ example: 5 }),
    totalPages: z.number().openapi({ example: 1 }),
  }),
});

export const messagesListResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.array(messageSchema),
  meta: z.object({
    hasMore: z.boolean().openapi({ example: true }),
    nextCursor: z.string().nullable().openapi({ example: 'cm4msg_older_id' }),
  }),
});

export const messageResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  data: messageSchema,
});

export const errorResponseSchema = z.object({
  success: z.boolean().openapi({ example: false }),
  error: z.string(),
});

import { db } from '@/db/client';
import { AppError } from '@/errors/base';
import { sanitizeHtml } from '@/utils/sanitize';
import { computeExpiresAt, isExpired } from '@/utils/expiry';
import { detectBlockedContent } from '@/utils/content-filter';
import { createNotification } from '@/modules/notifications/notifications.service'; // to send notifications to owner when a tenant sends a message request
import type { ConversationType, MessageType, ListConversationsQuery, GetMessagesQuery } from '../schemas';

function createId() {
  return crypto.randomUUID();
}

// Number of days a conversation stays active after owner acceptance
const CONVERSATION_TTL_DAYS = 30;

type Queryable = {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
};

// Conversation Lifecycle
/**
 * Create a conversation when a listing is unlocked.
 * Called from inside the unlock transaction in property.service.ts.
 * Idempotent — returns existing conversation if one already exists for (property, tenant).
 */
export async function createConversationOnUnlock(
  client: Queryable,
  tenantUserId: string,
  propertyId: string,
  ownerUserId: string
): Promise<string> {
  // Idempotent upsert: INSERT ON CONFLICT prevents duplicate conversation race condition
  const conversationId = createId();
  const upsertResult = await client.query(
    `INSERT INTO "Conversation" (
      id, property_id, tenant_user_id, owner_user_id, status, created_at
    ) VALUES ($1, $2, $3, $4, 'PENDING', NOW())
    ON CONFLICT (property_id, tenant_user_id) DO NOTHING
    RETURNING id`,
    [conversationId, propertyId, tenantUserId, ownerUserId]
  );

  // If ON CONFLICT fired, the row already exists — fetch the existing ID
  if (upsertResult.rows.length === 0) {
    const existing = await client.query(
      `SELECT id FROM "Conversation"
       WHERE property_id = $1 AND tenant_user_id = $2
       LIMIT 1`,
      [propertyId, tenantUserId]
    );
    return existing.rows[0].id as string;
  }

  // Resolve property title for notification
  const propResult = await client.query(
    `SELECT title FROM "Property" WHERE property_id = $1`,
    [propertyId]
  );
  const propertyTitle = propResult.rows[0]?.title || 'a property';

  // Notify owner (DB insert — WebSocket push handled by notification service)
  await createNotification(
    ownerUserId,
    'New chat request',
    `A tenant wants to chat about "${propertyTitle}".`,
    {
      conversation_id: conversationId,
      property_id: propertyId,
      url: '/chats',
    }
  );

  return conversationId;
}

/**
 * Owner accepts a PENDING conversation.
 * Sets status to ACCEPTED and computes expires_at = NOW() + 30 days.
 */
export async function acceptConversation(
  ownerUserId: string,
  conversationId: string
): Promise<ConversationType> {
  const conv = await getConversationRow(conversationId);

  if (!conv) {
    throw new AppError(404, 'Conversation not found');
  }

  if (conv.owner_user_id !== ownerUserId) {
    throw new AppError(403, 'Only the property owner can accept this conversation');
  }

  // Idempotent: already accepted
  if (conv.status === 'ACCEPTED') {
    return mapConversation(conv);
  }

  if (conv.status !== 'PENDING') {
    throw new AppError(400, `Cannot accept a conversation with status: ${conv.status}`);
  }

  const expiresAt = computeExpiresAt(new Date(), CONVERSATION_TTL_DAYS);

  // Optimistic concurrency: only update if status is still PENDING
  const updateResult = await db.query(
    `UPDATE "Conversation"
     SET status = 'ACCEPTED', expires_at = $1, updated_at = NOW()
     WHERE id = $2 AND status = 'PENDING'`,
    [expiresAt, conversationId]
  );

  if (updateResult.rowCount === 0) {
    throw new AppError(409, 'Conversation state has changed. Please refresh.');
  }

  // Notify tenant
  const propResult = await db.query(
    `SELECT title FROM "Property" WHERE property_id = $1`,
    [conv.property_id]
  );
  const propertyTitle = propResult.rows[0]?.title || 'a property';

  await createNotification(
    conv.tenant_user_id,
    'Chat accepted',
    `The owner accepted your chat request for "${propertyTitle}". You can now message freely.`,
    {
      conversation_id: conversationId,
      property_id: conv.property_id,
      url: `/chats/${conversationId}`,
    }
  );

  return mapConversation({
    ...conv,
    status: 'ACCEPTED',
    expires_at: expiresAt,
    updated_at: new Date(),
  });
}

/**
 * Either party closes a conversation.
 * Valid from PENDING or ACCEPTED → CLOSED.
 */
export async function closeConversation(
  userId: string,
  conversationId: string
): Promise<ConversationType> {
  const conv = await getConversationRow(conversationId);

  if (!conv) {
    throw new AppError(404, 'Conversation not found');
  }

  if (conv.tenant_user_id !== userId && conv.owner_user_id !== userId) {
    throw new AppError(403, 'You are not a participant in this conversation');
  }

  // Idempotent
  if (conv.status === 'CLOSED') {
    return mapConversation(conv);
  }

  const now = new Date();
  // Optimistic concurrency: only close if status hasn't changed since we read it
  const updateResult = await db.query(
    `UPDATE "Conversation"
     SET status = 'CLOSED', closed_at = $1, closed_by = $2, updated_at = $1
     WHERE id = $3 AND status = $4`,
    [now, userId, conversationId, conv.status]
  );

  if (updateResult.rowCount === 0) {
    throw new AppError(409, 'Conversation state has changed. Please refresh.');
  }

  // Notify the other party
  const otherUserId = userId === conv.tenant_user_id ? conv.owner_user_id : conv.tenant_user_id;
  await createNotification(
    otherUserId,
    'Conversation closed',
    'A conversation has been closed.',
    {
      conversation_id: conversationId,
      property_id: conv.property_id,
      url: `/chats/${conversationId}`,
    },
    false
  );

  return mapConversation({
    ...conv,
    status: 'CLOSED',
    closed_at: now,
    closed_by: userId,
    updated_at: now,
  });
}

// Conversation Queries

/**
 * Get a single conversation with query-time expiry enforcement.
 * Only participants can view.
 */
export async function getConversation(
  userId: string,
  conversationId: string
): Promise<ConversationType> {
  const conv = await getConversationRow(conversationId);

  if (!conv) {
    throw new AppError(404, 'Conversation not found');
  }

  if (conv.tenant_user_id !== userId && conv.owner_user_id !== userId) {
    throw new AppError(403, 'You are not a participant in this conversation');
  }

  // Query-time expiry: if ACCEPTED and past expiry, treat as CLOSED
  if (conv.status === 'ACCEPTED' && isExpired(conv.expires_at)) {
    // Lazily update DB status
    await db.query(
      `UPDATE "Conversation"
       SET status = 'CLOSED', closed_at = expires_at, closed_by = NULL, updated_at = NOW()
       WHERE id = $1 AND status = 'ACCEPTED'`,
      [conversationId]
    );
    return mapConversation({
      ...conv,
      status: 'CLOSED',
      closed_at: conv.expires_at,
      closed_by: null,
    });
  }

  return mapConversation(conv);
}

/**
 * List conversations for a user (tenant or owner).
 * Includes property summary, other party info, and last message preview.
 */
export async function listConversations(
  userId: string,
  role: string,
  query: ListConversationsQuery
): Promise<{
  conversations: ConversationType[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const { status, page, limit } = query;
  const offset = (page - 1) * limit;

  // Build WHERE clause
  const conditions: string[] = [];
  const params: any[] = [];
  let idx = 1;

  // User must be a participant
  conditions.push(`(c.tenant_user_id = $${idx} OR c.owner_user_id = $${idx})`);
  params.push(userId);
  idx++;

  if (status) {
    conditions.push(`c.status = $${idx}`);
    params.push(status);
    idx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count
  const countResult = await db.query(
    `SELECT COUNT(*)::int AS total FROM "Conversation" c ${whereClause}`,
    params
  );
  const total = countResult.rows[0]?.total ?? 0;

  // Fetch with property info, other party display name, and last message
  const listResult = await db.query(
    `SELECT
      c.id, c.property_id, c.tenant_user_id, c.owner_user_id,
      c.status, c.expires_at, c.created_at, c.updated_at,
      c.closed_at, c.closed_by,
      p.title AS property_title,
      p.area_name AS property_area,
      -- Tenant display name
      COALESCE(NULLIF(TRIM(CONCAT(COALESCE(bp_t.first_name, ''), ' ', COALESCE(bp_t.last_name, ''))), ''), 'Tenant') AS tenant_display_name,
      -- Owner display name
      COALESCE(NULLIF(TRIM(CONCAT(COALESCE(bp_o.first_name, ''), ' ', COALESCE(bp_o.last_name, ''))), ''), 'Owner') AS owner_display_name,
      -- Last message subquery
      lm.content AS last_message_content,
      lm.created_at AS last_message_at,
      lm.sender_user_id AS last_message_sender
     FROM "Conversation" c
     JOIN "Property" p ON p.property_id = c.property_id
     LEFT JOIN "BaseUserProfile" bp_t ON bp_t.user_id = c.tenant_user_id
     LEFT JOIN "BaseUserProfile" bp_o ON bp_o.user_id = c.owner_user_id
     LEFT JOIN LATERAL (
       SELECT content, created_at, sender_user_id
       FROM "Message"
       WHERE conversation_id = c.id
       ORDER BY created_at DESC
       LIMIT 1
     ) lm ON true
     ${whereClause}
     ORDER BY COALESCE(lm.created_at, c.created_at) DESC
     LIMIT $${idx} OFFSET $${idx + 1}`,
    [...params, limit, offset]
  );

  const conversations = listResult.rows.map((row) => {
    // Determine other party based on requesting user
    const isOwner = userId === row.owner_user_id;
    const otherParty = {
      userId: isOwner ? row.tenant_user_id : row.owner_user_id,
      displayName: isOwner ? row.tenant_display_name : row.owner_display_name,
    };

    const mapped = mapConversation(row);
    return {
      ...mapped,
      property: {
        title: row.property_title,
        areaName: row.property_area,
      },
      otherParty,
      lastMessage: row.last_message_content
        ? {
            content: row.last_message_content,
            createdAt: row.last_message_at.toISOString(),
            senderId: row.last_message_sender,
          }
        : null,
    };
  });

  return {
    conversations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Messaging

/**
 * Send a message in a conversation.
 * Enforces:
 * - Participant access check
 * - Status check (PENDING with one-message gate, or ACCEPTED)
 * - Query-time expiry check
 * - Content filtering (phone numbers, emails, Bangla digits)
 * - HTML sanitization
 */
export async function sendMessage(
  userId: string,
  conversationId: string,
  content: string
): Promise<MessageType> {
  // Content filter
  const filterResult = detectBlockedContent(content);
  if (filterResult.blocked) {
    throw new AppError(400, filterResult.reason || 'Message contains blocked content');
  }

  // Sanitize
  const sanitizedContent = sanitizeHtml(content.trim());

  if (sanitizedContent.length === 0) {
    throw new AppError(400, 'Message cannot be empty');
  }

  if (sanitizedContent.length > 2000) {
    throw new AppError(400, 'Message cannot exceed 2000 characters');
  }

  // Use a transaction with row-level lock to prevent race conditions
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Lock the conversation row to serialize concurrent sends
    const convResult = await client.query(
      `SELECT id, property_id, tenant_user_id, owner_user_id,
              status, expires_at, created_at, updated_at,
              closed_at, closed_by
       FROM "Conversation"
       WHERE id = $1
       FOR UPDATE`,
      [conversationId]
    );

    if (convResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new AppError(404, 'Conversation not found');
    }

    const conv = convResult.rows[0];

    // Access check
    if (conv.tenant_user_id !== userId && conv.owner_user_id !== userId) {
      await client.query('ROLLBACK');
      throw new AppError(403, 'You are not a participant in this conversation');
    }

    // Status check
    if (conv.status === 'CLOSED') {
      await client.query('ROLLBACK');
      throw new AppError(403, 'This conversation has been closed');
    }

    // Expiry check (query-time enforcement)
    if (conv.status === 'ACCEPTED' && isExpired(conv.expires_at)) {
      // Lazily close within the same transaction
      await client.query(
        `UPDATE "Conversation"
         SET status = 'CLOSED', closed_at = expires_at, closed_by = NULL, updated_at = NOW()
         WHERE id = $1 AND status = 'ACCEPTED'`,
        [conversationId]
      );
      await client.query('COMMIT');
      throw new AppError(403, 'This conversation has expired');
    }

    // One-message gate for PENDING conversations
    if (conv.status === 'PENDING') {
      // Only tenant can send the first message
      if (userId !== conv.tenant_user_id) {
        await client.query('ROLLBACK');
        throw new AppError(403, 'Accept the conversation before sending a message');
      }

      const msgCountResult = await client.query(
        `SELECT COUNT(*)::int AS count
         FROM "Message"
         WHERE conversation_id = $1 AND sender_user_id = $2`,
        [conversationId, userId]
      );

      if (msgCountResult.rows[0].count >= 1) {
        await client.query('ROLLBACK');
        throw new AppError(403, 'Waiting for the owner to accept the conversation');
      }
    }

    // Persist with RETURNING to avoid a second round trip
    const messageId = createId();
    const msgResult = await client.query(
      `INSERT INTO "Message" (id, conversation_id, sender_user_id, content, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, conversation_id, sender_user_id, content, created_at`,
      [messageId, conversationId, userId, sanitizedContent]
    );

    await client.query('COMMIT');

    const msg = msgResult.rows[0];

    return {
      messageId: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_user_id,
      content: msg.content,
      createdAt: msg.created_at.toISOString(),
    };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {  }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Get messages for a conversation with cursor-based pagination (newest first, paginating backwards).
 * Only participants can read messages.
 */
export async function getMessages(
  userId: string,
  conversationId: string,
  query: GetMessagesQuery
): Promise<{ messages: MessageType[]; hasMore: boolean; nextCursor: string | null }> {
  const conv = await getConversationRow(conversationId);

  if (!conv) {
    throw new AppError(404, 'Conversation not found');
  }

  if (conv.tenant_user_id !== userId && conv.owner_user_id !== userId) {
    throw new AppError(403, 'You are not a participant in this conversation');
  }

  const { cursor, limit } = query;
  const params: any[] = [conversationId];
  let idx = 2;

  let cursorClause = '';
  if (cursor) {
    // Get the created_at for the cursor message
    const cursorResult = await db.query(
      `SELECT created_at FROM "Message" WHERE id = $1 AND conversation_id = $2`,
      [cursor, conversationId]
    );

    if (cursorResult.rows.length > 0) {
      cursorClause = `AND (m.created_at, m.id) < ($${idx}, $${idx + 1})`;
      params.push(cursorResult.rows[0].created_at, cursor);
      idx += 2;
    }
  }

  // Fetch limit + 1 to determine hasMore
  const fetchLimit = limit + 1;
  params.push(fetchLimit);

  const result = await db.query(
    `SELECT m.id, m.conversation_id, m.sender_user_id, m.content, m.created_at
     FROM "Message" m
     WHERE m.conversation_id = $1 ${cursorClause}
     ORDER BY m.created_at DESC, m.id DESC
     LIMIT $${idx}`,
    params
  );

  const hasMore = result.rows.length > limit;
  const rows = hasMore ? result.rows.slice(0, limit) : result.rows;

  const messages: MessageType[] = rows.map((row) => ({
    messageId: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_user_id,
    content: row.content,
    createdAt: row.created_at.toISOString(),
  }));

  const nextCursor = hasMore ? rows[rows.length - 1].id : null;

  return { messages, hasMore, nextCursor };
}

// Internal Helpers

async function getConversationRow(conversationId: string) {
  const result = await db.query(
    `SELECT id, property_id, tenant_user_id, owner_user_id,
            status, expires_at, created_at, updated_at,
            closed_at, closed_by
     FROM "Conversation"
     WHERE id = $1
     LIMIT 1`,
    [conversationId]
  );

  return result.rows.length > 0 ? result.rows[0] : null;
}

function mapConversation(row: any): ConversationType {
  return {
    conversationId: row.id,
    propertyId: row.property_id,
    tenantUserId: row.tenant_user_id,
    ownerUserId: row.owner_user_id,
    status: row.status,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    closedAt: row.closed_at ? new Date(row.closed_at).toISOString() : null,
    closedBy: row.closed_by || null,
  };
}

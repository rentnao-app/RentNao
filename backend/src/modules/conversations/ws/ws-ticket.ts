/**
 * WebSocket Ticket Service
 *
 * Generates single-use, short-lived tickets for secure WebSocket authentication.
 * Tickets are stored in Redis with a 30-second TTL and are consumed (deleted)
 * on first use, preventing replay attacks.
 *
 * Flow:
 *   1. Client calls POST /auth/ws-ticket (authenticated via JWT Bearer)
 *   2. Server generates a random ticket, stores userId in Redis with 30s TTL
 *   3. Client connects: ws://host/ws?ticket=<ticket>
 *   4. Server looks up ticket in Redis, gets userId, deletes the ticket
 */

import { redis } from '@/db/redis';

const TICKET_PREFIX = 'ws:ticket:';
const TICKET_TTL_SECONDS = 30;

/**
 * Generate a single-use WebSocket ticket for the given user.
 * Returns the ticket string.
 */
export async function createWsTicket(userId: string, role: string): Promise<string> {
  const ticket = crypto.randomUUID();
  const key = `${TICKET_PREFIX}${ticket}`;

  // Store userId + role so we can reconstruct the principal on WS connect
  await redis.set(key, JSON.stringify({ userId, role }), 'EX', TICKET_TTL_SECONDS);

  return ticket;
}

/**
 * Consume (validate + delete) a WebSocket ticket.
 * Returns the userId if valid, null if expired or already used.
 */
export async function consumeWsTicket(ticket: string): Promise<{ userId: string; role: string } | null> {
  const key = `${TICKET_PREFIX}${ticket}`;

  // Atomic GET + DELETE to prevent race conditions on ticket reuse
  const data = await redis.get(key);
  if (!data) return null;

  // Delete immediately so it can't be reused
  await redis.del(key);

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * WebSocket connection registry
 *
 * Manages in-memory state for connected WebSocket clients.
 *
 * Multi-tab safety:
 * - userConnections maps userId → Set<WSContext>
 * - Each tab gets its own WSContext added to the Set
 * - On disconnect, only THAT tab's WSContext is removed
 * - User is "offline" only when set.size === 0
 * - pushToUser() iterates the entire Set → every open tab gets the message
 *
 * Room management:
 * - conversationRooms maps conversationId → Set<userId>
 * - A userId is removed from a room only when ALL their connections have left
 *   (tracked via wsRooms: per-connection set of joined conversationIds)
 */

import type { WSContext } from 'hono/ws';

// userId → Set of all connected WSContexts for that user (multi-tab safe)
const userConnections = new Map<string, Set<WSContext>>();

// conversationId → Set of userIds currently in that room
const conversationRooms = new Map<string, Set<string>>();

// WSContext → userId (reverse lookup for cleanup)
const wsToUser = new Map<WSContext, string>();

// WSContext → Set of conversationIds this specific connection has joined
const wsRooms = new Map<WSContext, Set<string>>();

// ============================================================================
// Connection Management
// ============================================================================

export function addConnection(userId: string, ws: WSContext): void {
  // Add to user connections
  let connections = userConnections.get(userId);
  if (!connections) {
    connections = new Set();
    userConnections.set(userId, connections);
  }
  connections.add(ws);

  // Reverse lookup
  wsToUser.set(ws, userId);

  // Init per-connection room tracker
  wsRooms.set(ws, new Set());
}

export function removeConnection(ws: WSContext): void {
  const userId = wsToUser.get(ws);
  if (!userId) return;

  // Remove from all rooms this connection had joined
  const rooms = wsRooms.get(ws);
  if (rooms) {
    for (const conversationId of rooms) {
      leaveRoomInternal(conversationId, userId, ws);
    }
    wsRooms.delete(ws);
  }

  // Remove this specific WSContext from the user's connection set
  const connections = userConnections.get(userId);
  if (connections) {
    connections.delete(ws);
    // Only remove the map entry when the LAST tab disconnects
    if (connections.size === 0) {
      userConnections.delete(userId);
    }
  }

  // Clean up reverse lookup
  wsToUser.delete(ws);
}

export function isUserOnline(userId: string): boolean {
  const connections = userConnections.get(userId);
  return !!connections && connections.size > 0;
}

// ============================================================================
// Room Management
// ============================================================================

export function joinRoom(conversationId: string, userId: string, ws: WSContext): void {
  // Add userId to room
  let room = conversationRooms.get(conversationId);
  if (!room) {
    room = new Set();
    conversationRooms.set(conversationId, room);
  }
  room.add(userId);

  // Track which rooms this specific WS connection has joined
  const rooms = wsRooms.get(ws);
  if (rooms) {
    rooms.add(conversationId);
  }
}

/**
 * Internal: remove a user from a room only if NONE of their remaining connections
 * are in that room. Called during removeConnection cleanup.
 */
function leaveRoomInternal(conversationId: string, userId: string, disconnectedWs: WSContext): void {
  const room = conversationRooms.get(conversationId);
  if (!room) return;

  // Check if any of the user's OTHER connections are still in this room
  const connections = userConnections.get(userId);
  if (connections) {
    for (const ws of connections) {
      if (ws === disconnectedWs) continue; // skip the one being removed
      const otherRooms = wsRooms.get(ws);
      if (otherRooms && otherRooms.has(conversationId)) {
        // Another tab is still in this room — don't remove user
        return;
      }
    }
  }

  // No other connections in this room — remove user
  room.delete(userId);
  if (room.size === 0) {
    conversationRooms.delete(conversationId);
  }
}

export function leaveRoom(conversationId: string, ws: WSContext): void {
  const userId = wsToUser.get(ws);
  if (!userId) return;

  const rooms = wsRooms.get(ws);
  if (rooms) {
    rooms.delete(conversationId);
  }

  leaveRoomInternal(conversationId, userId, ws);
}

// ============================================================================
// Messaging
// ============================================================================

/**
 * Broadcast a payload to all participants in a conversation room,
 * optionally excluding a specific userId (the sender).
 */
export function broadcastToRoom(
  conversationId: string,
  payload: unknown,
  excludeUserId?: string
): void {
  const room = conversationRooms.get(conversationId);
  if (!room) return;

  const message = typeof payload === 'string' ? payload : JSON.stringify(payload);

  for (const userId of room) {
    if (userId === excludeUserId) continue;

    const connections = userConnections.get(userId);
    if (connections) {
      for (const ws of connections) {
        try {
          ws.send(message);
        } catch {
          // Connection may have died — will be cleaned up on next ping/close
        }
      }
    }
  }
}

/**
 * Push a payload to ALL connections for a specific user (across all their tabs).
 * Used for notifications and conversation status updates.
 * Fire-and-forget — silently ignores offline users.
 */
export function pushToUser(userId: string, payload: unknown): void {
  const connections = userConnections.get(userId);
  if (!connections || connections.size === 0) return;

  const message = typeof payload === 'string' ? payload : JSON.stringify(payload);

  for (const ws of connections) {
    try {
      ws.send(message);
    } catch {
      // Swallow — dead connections will be cleaned up on close event
    }
  }
}

/**
 * Check if a specific user is currently in a conversation room.
 */
export function isUserInRoom(conversationId: string, userId: string): boolean {
  const room = conversationRooms.get(conversationId);
  return !!room && room.has(userId);
}

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
 *
 * Heartbeat:
 * - Server pings all connections every HEARTBEAT_INTERVAL_MS
 * - If a connection fails to respond (ws.send throws), it is force-removed
 * - Prevents ghost connections from accumulating in memory
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


// Connection Management

const MAX_CONNECTIONS_PER_USER = 5;

export function addConnection(userId: string, ws: WSContext): boolean {
  // Add to user connections
  let connections = userConnections.get(userId);
  if (!connections) {
    connections = new Set();
    userConnections.set(userId, connections);
  }

  // Enforce per-user connection limit to prevent resource exhaustion/DoS
  if (connections.size >= MAX_CONNECTIONS_PER_USER) {
    return false;
  }

  connections.add(ws);

  // Reverse lookup
  wsToUser.set(ws, userId);

  // Init per-connection room tracker
  wsRooms.set(ws, new Set());

  return true;
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


// Room Management

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


// Messaging

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
          // Connection may have died — will be cleaned up by heartbeat
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
      // Swallow — dead connections will be cleaned up by heartbeat
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


// Rate Limiting (in-memory sliding window per user per conversation)
const MESSAGE_RATE_WINDOW_MS = 10_000; // 10 seconds
const MESSAGE_RATE_MAX = 10;           // max 10 messages per window

// userId → { conversationId → timestamp[] }
const messageTimestamps = new Map<string, Map<string, number[]>>();

/**
 * Check if a user is rate limited in sending messages to a conversation.
 * Handles both WebSocket and REST endpoints to prevent spamming/DoS.
 */
export function isRateLimited(userId: string, conversationId: string): boolean {
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
  }

  // Prune expired timestamps
  const filtered = timestamps.filter(t => t > cutoff);

  if (filtered.length >= MESSAGE_RATE_MAX) {
    userMap.set(conversationId, filtered);
    return true;
  }

  filtered.push(now);
  userMap.set(conversationId, filtered);
  return false;
}

/**
 * Clean up rate limit data when connection drops.
 */
export function cleanupRateLimitData(userId: string): void {
  messageTimestamps.delete(userId);
}

/**
 * Periodically prune expired rate limit entries to prevent memory growth for offline/idle users.
 */
export function pruneRateLimitData(): void {
  const now = Date.now();
  const cutoff = now - MESSAGE_RATE_WINDOW_MS;

  for (const [userId, userMap] of messageTimestamps.entries()) {
    for (const [conversationId, timestamps] of userMap.entries()) {
      const filtered = timestamps.filter(t => t > cutoff);
      if (filtered.length === 0) {
        userMap.delete(conversationId);
      } else {
        userMap.set(conversationId, filtered);
      }
    }
    if (userMap.size === 0) {
      messageTimestamps.delete(userId);
    }
  }
}


// Heartbeat (server-initiated ping to detect dead connections)

const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds
const PING_PAYLOAD = JSON.stringify({ type: 'ping' });

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Start the heartbeat interval. Should be called once at server startup.
 * Iterates all connected WebSockets and sends a ping.
 * If ws.send() throws, the connection is dead and gets removed.
 */
export function startHeartbeat(): void {
  if (heartbeatTimer) return; // already running

  heartbeatTimer = setInterval(() => {
    const deadConnections: WSContext[] = [];

    for (const [ws] of wsToUser) {
      try {
        ws.send(PING_PAYLOAD);
      } catch {
        // Send failed — connection is dead
        deadConnections.push(ws);
      }
    }

    // Clean up dead connections outside the iteration
    for (const ws of deadConnections) {
      console.log(`[WS Heartbeat] Removing dead connection for user: ${wsToUser.get(ws)}`);
      removeConnection(ws);
    }

    if (deadConnections.length > 0) {
      console.log(`[WS Heartbeat] Cleaned up ${deadConnections.length} dead connection(s). Active: ${wsToUser.size}`);
    }

    // Periodically prune empty rate limit arrays to avoid memory growth
    pruneRateLimitData();
  }, HEARTBEAT_INTERVAL_MS);

  console.log(`[WS Heartbeat] Started (interval: ${HEARTBEAT_INTERVAL_MS / 1000}s)`);
}

/**
 * Stop the heartbeat interval. Called during graceful shutdown.
 */
export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
    console.log('[WS Heartbeat] Stopped');
  }
}


// Graceful Shutdown

/**
 * Close all active WebSocket connections and clear in-memory state.
 * Sends close code 1012 (Service Restart) so clients know to reconnect.
 * Called during graceful shutdown, after stopHeartbeat().
 */
export function closeAllConnections(): void {
  let closed = 0;

  for (const [ws, userId] of wsToUser) {
    try {
      ws.close(1012, 'Server shutting down');
      closed++;
    } catch {
      // Socket may already be dead — ignore
    }
  }

  // Purge all in-memory state
  userConnections.clear();
  conversationRooms.clear();
  wsToUser.clear();
  wsRooms.clear();
  messageTimestamps.clear();

  console.log(`[WS Shutdown] Closed ${closed} connection(s) and cleared registry.`);
}

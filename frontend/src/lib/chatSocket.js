import { createWsTicket, getWsBaseUrl } from './conversations';

/**
 * Lightweight WebSocket client for RentNao chat.
 * Uses ticket auth from POST /conversations/ws-ticket.
 */
export class ChatSocket {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.ws = null;
    this.activeConversationId = null;
    this.connecting = false;
    this.closed = false;
  }

  async connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.connecting) return;
    this.connecting = true;
    this.closed = false;

    try {
      const ticket = await createWsTicket();
      if (!ticket) throw new Error('No WebSocket ticket');

      const url = `${getWsBaseUrl()}?ticket=${encodeURIComponent(ticket)}`;
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.connecting = false;
        this.handlers.onOpen?.();
        if (this.activeConversationId) {
          this.join(this.activeConversationId);
        }
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }
          this.handlers.onEvent?.(payload);
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onerror = () => {
        this.handlers.onError?.(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        this.connecting = false;
        this.handlers.onClose?.();
        if (!this.closed) {
          window.setTimeout(() => {
            if (!this.closed) void this.connect();
          }, 3000);
        }
      };
    } catch (err) {
      this.connecting = false;
      this.handlers.onError?.(err);
    }
  }

  join(conversationId) {
    this.activeConversationId = conversationId;
    this.send({ type: 'join', conversationId });
  }

  leave(conversationId) {
    if (this.activeConversationId === conversationId) {
      this.activeConversationId = null;
    }
    this.send({ type: 'leave', conversationId });
  }

  sendMessage(conversationId, content) {
    this.send({ type: 'message', conversationId, content });
  }

  send(payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  disconnect() {
    this.closed = true;
    if (this.activeConversationId) {
      this.leave(this.activeConversationId);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

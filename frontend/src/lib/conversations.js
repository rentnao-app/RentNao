import { apiFetch, getApiErrorMessage, getUserId, getUserRole, isLoggedIn } from './api';

export function getWsBaseUrl() {
  const api = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const url = new URL(api);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${url.origin}/ws`;
}

function parseList(body) {
  return {
    conversations: Array.isArray(body?.data) ? body.data : [],
    meta: body?.meta || { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}

export async function listConversations({ status, page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (status) params.set('status', status);

  const res = await apiFetch(`/conversations?${params.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to load conversations'));
  return parseList(body);
}

export async function getConversation(conversationId) {
  const res = await apiFetch(`/conversations/${encodeURIComponent(conversationId)}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to load conversation'));
  return body?.data || null;
}

export async function getMessages(conversationId, { cursor, limit = 50 } = {}) {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (cursor) params.set('cursor', cursor);

  const res = await apiFetch(
    `/conversations/${encodeURIComponent(conversationId)}/messages?${params.toString()}`
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to load messages'));
  return {
    messages: Array.isArray(body?.data) ? body.data : [],
    hasMore: Boolean(body?.meta?.hasMore),
    nextCursor: body?.meta?.nextCursor || null,
  };
}

export async function sendConversationMessage(conversationId, content) {
  const res = await apiFetch(`/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to send message'));
  return body?.data || null;
}

export async function acceptConversation(conversationId) {
  const res = await apiFetch(`/conversations/${encodeURIComponent(conversationId)}/accept`, {
    method: 'PATCH',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to accept conversation'));
  return body?.data || null;
}

export async function closeConversation(conversationId) {
  const res = await apiFetch(`/conversations/${encodeURIComponent(conversationId)}/close`, {
    method: 'PATCH',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to close conversation'));
  return body?.data || null;
}

export async function createWsTicket() {
  const res = await apiFetch('/conversations/ws-ticket', { method: 'POST' });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(getApiErrorMessage(body, 'Failed to connect to chat'));
  return body?.data?.ticket || null;
}

export async function findConversationByProperty(propertyId) {
  if (!propertyId) return null;
  const { conversations } = await listConversations({ limit: 50 });
  const match = conversations.find((c) => c.propertyId === propertyId);
  return match?.conversationId || null;
}

export function isChatRole() {
  if (!isLoggedIn()) return false;
  const role = getUserRole();
  return role === 'TENANT' || role === 'OWNER';
}

export function formatChatTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function conversationStatusLabel(status, t) {
  const key = String(status || '').toUpperCase();
  return t(`chats.status.${key}`, key);
}

export function canUserSendMessage({ conversation, userId, messages }) {
  if (!conversation || conversation.status === 'CLOSED') return false;
  if (conversation.status === 'ACCEPTED') {
    if (conversation.expiresAt && new Date(conversation.expiresAt) < new Date()) return false;
    return true;
  }
  if (conversation.status === 'PENDING') {
    if (userId !== conversation.tenantUserId) return false;
    const sent = (messages || []).some((m) => m.senderId === userId);
    return !sent;
  }
  return false;
}

export function isConversationOwner(conversation, userId) {
  return conversation?.ownerUserId === userId;
}

export function getCurrentParticipantIds() {
  return { userId: getUserId(), role: getUserRole() };
}

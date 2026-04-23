import { apiFetch, getCurrentUser, getUserId, isLoggedIn } from './api';

const MAX_LOCAL_ITEMS = 100;

function getStorageKey(userId) {
  return `rentnao_notifications_${userId || 'guest'}`;
}

function normalizeNotification(raw) {
  return {
    id: raw?.notification_id || raw?.notificationId || raw?.id || crypto.randomUUID(),
    title: raw?.title || 'Notification',
    message: raw?.message || '',
    isRead: Boolean(raw?.is_read ?? raw?.isRead),
    createdAt: raw?.created_at || raw?.createdAt || new Date().toISOString(),
    url: raw?.data?.url || raw?.url || '/notifications',
    source: raw?.source || 'remote',
    type: raw?.type || raw?.data?.type || 'GENERAL',
  };
}

function getLocalNotifications() {
  const user = getCurrentUser();
  const userId = getUserId(user);
  if (!userId) return [];

  const key = getStorageKey(userId);
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeNotification({ ...item, source: 'local' }));
  } catch {
    return [];
  }
}

function saveLocalNotifications(items) {
  const user = getCurrentUser();
  const userId = getUserId(user);
  if (!userId) return;

  const key = getStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(items.slice(0, MAX_LOCAL_ITEMS)));
}

function sortByDateDesc(items) {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addLocalNotification({ title, message, url = '/notifications', type = 'GENERAL' }) {
  const current = getLocalNotifications();
  const item = normalizeNotification({
    id: crypto.randomUUID(),
    title,
    message,
    is_read: false,
    created_at: new Date().toISOString(),
    url,
    type,
    source: 'local',
  });
  const next = sortByDateDesc([item, ...current]);
  saveLocalNotifications(next);
  return item;
}

export async function fetchNotifications({ limit = 20 } = {}) {
  const localItems = sortByDateDesc(getLocalNotifications());

  if (!isLoggedIn()) {
    return { items: localItems.slice(0, limit), remoteAvailable: false };
  }

  try {
    const res = await apiFetch(`/notifications?limit=${limit}`);
    if (!res.ok) {
      return { items: localItems.slice(0, limit), remoteAvailable: false };
    }

    const body = await res.json().catch(() => ({}));
    const remoteItemsRaw = body?.notifications || body?.data || [];
    const remoteItems = Array.isArray(remoteItemsRaw)
      ? remoteItemsRaw.map((item) => normalizeNotification(item))
      : [];
    const merged = sortByDateDesc([...remoteItems, ...localItems]);
    return { items: merged.slice(0, limit), remoteAvailable: true };
  } catch {
    return { items: localItems.slice(0, limit), remoteAvailable: false };
  }
}

export async function fetchUnreadCount() {
  const localUnread = getLocalNotifications().filter((item) => !item.isRead).length;

  if (!isLoggedIn()) {
    return { count: localUnread, remoteAvailable: false };
  }

  try {
    const res = await apiFetch('/notifications/unread-count');
    if (!res.ok) {
      return { count: localUnread, remoteAvailable: false };
    }

    const body = await res.json().catch(() => ({}));
    const remoteCount = Number(body?.count ?? body?.unreadCount ?? 0);
    return {
      count: Math.max(remoteCount, localUnread),
      remoteAvailable: true,
    };
  } catch {
    return { count: localUnread, remoteAvailable: false };
  }
}

export async function markAllNotificationsRead() {
  const local = getLocalNotifications().map((item) => ({ ...item, isRead: true }));
  saveLocalNotifications(local);

  if (!isLoggedIn()) return { ok: true, remoteAvailable: false };

  try {
    const res = await apiFetch('/notifications/read-all', { method: 'PATCH' });
    return { ok: res.ok, remoteAvailable: res.ok };
  } catch {
    return { ok: true, remoteAvailable: false };
  }
}

export function markNotificationRead(notificationId) {
  const local = getLocalNotifications();
  const updated = local.map((item) =>
    item.id === notificationId ? { ...item, isRead: true } : item
  );
  saveLocalNotifications(updated);
}

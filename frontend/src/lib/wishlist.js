import { apiFetch, getCurrentUser, getUserId, getUserRole, isLoggedIn } from './api';

const MAX_LOCAL_WISHLIST = 200;

function isTenantUser() {
  if (!isLoggedIn()) return false;
  return getUserRole(getCurrentUser()) === 'TENANT';
}

function getStorageKey(userId) {
  return `rentnao_wishlist_${userId || 'guest'}`;
}

function getCurrentStorageKey() {
  const userId = getUserId(getCurrentUser());
  return getStorageKey(userId);
}

function normalizeId(value) {
  return String(value || '').trim();
}

function normalizeSnapshot(raw) {
  if (!raw) return null;
  const listing = raw.listing || raw;
  const listingId = normalizeId(
    listing?.listingId || listing?.listing_id || raw?.listingId || raw?.listing_id
  );
  if (!listingId) return null;

  return {
    listingId,
    title: listing?.title || listing?.listingTitle || null,
    rent: listing?.rent ?? null,
    areaName: listing?.areaName || listing?.area_name || null,
    roomCount: listing?.roomCount ?? listing?.room_count ?? null,
    bathroomCount: listing?.bathroomCount ?? listing?.bathroom_count ?? null,
    propertySizeSqft: listing?.propertySizeSqft ?? listing?.property_size_sqft ?? null,
    primaryImageUrl: listing?.primaryImageUrl || listing?.primary_image_url || null,
    createdAt: listing?.createdAt || listing?.created_at || new Date().toISOString(),
  };
}

function readLocalWishlist() {
  try {
    const raw = localStorage.getItem(getCurrentStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item?.listingId).slice(0, MAX_LOCAL_WISHLIST);
  } catch {
    return [];
  }
}

function writeLocalWishlist(items) {
  localStorage.setItem(getCurrentStorageKey(), JSON.stringify(items.slice(0, MAX_LOCAL_WISHLIST)));
}

function upsertLocalWishlist(snapshot) {
  const list = readLocalWishlist();
  const next = list.filter((item) => item.listingId !== snapshot.listingId);
  next.unshift({
    ...snapshot,
    savedAt: new Date().toISOString(),
  });
  writeLocalWishlist(next);
}

function removeLocalWishlist(listingId) {
  const id = normalizeId(listingId);
  const list = readLocalWishlist();
  writeLocalWishlist(list.filter((item) => item.listingId !== id));
}

async function tryRemoteList() {
  if (!isTenantUser()) return { items: [], remoteAvailable: false };
  try {
    const res = await apiFetch('/wishlists');
    if (!res.ok) return { items: [], remoteAvailable: false };
    const body = await res.json().catch(() => ({}));
    const rawItems = body?.wishlist || body?.data || body || [];
    const items = Array.isArray(rawItems)
      ? rawItems.map((item) => normalizeSnapshot(item)).filter(Boolean)
      : [];
    return { items, remoteAvailable: true };
  } catch {
    return { items: [], remoteAvailable: false };
  }
}

async function tryRemoteAdd(listingId) {
  if (!isTenantUser()) return false;
  try {
    const id = normalizeId(listingId);
    const attempts = [
      { path: `/wishlists/${id}`, method: 'POST' },
      { path: '/wishlists', method: 'POST', body: JSON.stringify({ listingId: id }) },
    ];
    for (const attempt of attempts) {
      const res = await apiFetch(attempt.path, {
        method: attempt.method,
        headers: { 'Content-Type': 'application/json' },
        body: attempt.body,
      });
      if (res.ok) return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function tryRemoteRemove(listingId) {
  if (!isTenantUser()) return false;
  try {
    const id = normalizeId(listingId);
    const attempts = [
      { path: `/wishlists/${id}`, method: 'DELETE' },
      { path: `/wishlists/${id}`, method: 'POST', body: JSON.stringify({ action: 'REMOVE' }) },
    ];
    for (const attempt of attempts) {
      const res = await apiFetch(attempt.path, {
        method: attempt.method,
        headers: { 'Content-Type': 'application/json' },
        body: attempt.body,
      });
      if (res.ok) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function getWishlistState() {
  const localItems = readLocalWishlist();
  const remote = await tryRemoteList();
  const mergedById = new Map();
  [...remote.items, ...localItems].forEach((item) => {
    if (!item?.listingId) return;
    if (!mergedById.has(item.listingId)) mergedById.set(item.listingId, item);
  });
  const items = Array.from(mergedById.values()).sort(
    (a, b) => new Date(b.savedAt || b.createdAt || 0).getTime() - new Date(a.savedAt || a.createdAt || 0).getTime()
  );
  return {
    items,
    ids: new Set(items.map((item) => item.listingId)),
    remoteAvailable: remote.remoteAvailable,
  };
}

export async function addToWishlist(listing) {
  const snapshot = normalizeSnapshot(listing);
  if (!snapshot) return { ok: false, remoteAvailable: false };
  const remoteOk = await tryRemoteAdd(snapshot.listingId);
  upsertLocalWishlist(snapshot);
  return { ok: true, remoteAvailable: remoteOk };
}

export async function removeFromWishlist(listingId) {
  const id = normalizeId(listingId);
  const remoteOk = await tryRemoteRemove(id);
  removeLocalWishlist(id);
  return { ok: true, remoteAvailable: remoteOk };
}

export async function toggleWishlist(listing, shouldSave) {
  const snapshot = normalizeSnapshot(listing);
  if (!snapshot) return { ok: false, saved: false, remoteAvailable: false };
  if (shouldSave) {
    const result = await addToWishlist(snapshot);
    return { ...result, saved: true, listingId: snapshot.listingId };
  }
  const result = await removeFromWishlist(snapshot.listingId);
  return { ...result, saved: false, listingId: snapshot.listingId };
}

import { apiFetch, getCurrentUser, getUserId, isLoggedIn } from './api';
import { savePublicProfileSnapshot } from './publicProfiles';

const STORAGE_KEY = 'rentnao_requests';

function normalizeId(value) {
  return String(value || '').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function getCurrentUserSnapshot() {
  const user = getCurrentUser();
  const userId = getUserId(user);
  return {
    userId: normalizeId(userId),
    name: user?.username || user?.contactEmail || user?.email || 'User',
    email: user?.contactEmail || user?.contact_email || user?.email || '',
    phone: user?.contactPhone || user?.contact_phone || '',
  };
}

function readLocalRequests() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalRequests(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function normalizeRequest(raw) {
  return {
    requestId: normalizeId(raw?.requestId || raw?.request_id || raw?.id || crypto.randomUUID()),
    listingId: normalizeId(raw?.listingId || raw?.listing_id || raw?.listing?.listingId || raw?.listing?.listing_id),
    requestStatus: (raw?.requestStatus || raw?.request_status || raw?.status || 'PENDING').toUpperCase(),
    tenantUserId: normalizeId(raw?.tenantUserId || raw?.tenant_user_id || raw?.tenant?.userId || raw?.tenant?.user_id),
    ownerUserId: normalizeId(raw?.ownerUserId || raw?.owner_user_id || raw?.owner?.userId || raw?.owner?.user_id),
    requestedAt: raw?.requestedAt || raw?.requested_at || raw?.createdAt || nowIso(),
    updatedAt: raw?.updatedAt || raw?.updated_at || raw?.createdAt || nowIso(),
    note: raw?.note || raw?.message || '',
    listing: {
      listingId: normalizeId(raw?.listing?.listingId || raw?.listing?.listing_id || raw?.listingId || raw?.listing_id),
      rent: raw?.listing?.rent ?? raw?.rent ?? null,
      areaName: raw?.listing?.areaName || raw?.listing?.area_name || raw?.areaName || null,
      roomCount: raw?.listing?.roomCount ?? raw?.listing?.room_count ?? raw?.roomCount ?? null,
      primaryImageUrl: raw?.listing?.primaryImageUrl || raw?.listing?.primary_image_url || raw?.primaryImageUrl || null,
    },
    tenant: {
      userId: normalizeId(raw?.tenant?.userId || raw?.tenant?.user_id || raw?.tenantUserId || raw?.tenant_user_id),
      name: raw?.tenant?.name || raw?.tenant?.username || raw?.tenantName || 'Tenant',
      email: raw?.tenant?.email || raw?.tenantEmail || '',
      phone: raw?.tenant?.phone || raw?.tenantPhone || '',
    },
    source: raw?.source || 'remote',
  };
}

function listLocalTenantRequests(tenantUserId) {
  return readLocalRequests()
    .map(normalizeRequest)
    .filter((item) => item.tenantUserId === tenantUserId)
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

function listLocalOwnerRequests(ownerListingIds = []) {
  const allowByListing = new Set(ownerListingIds.map((id) => normalizeId(id)));
  return readLocalRequests()
    .map(normalizeRequest)
    .filter((item) => {
      if (allowByListing.size > 0) {
        return allowByListing.has(item.listingId);
      }
      return true;
    })
    .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
}

function updateLocalRequest(requestId, patch) {
  const id = normalizeId(requestId);
  const list = readLocalRequests();
  const updated = list.map((item) => {
    const normalized = normalizeRequest(item);
    if (normalized.requestId !== id) return normalized;
    return {
      ...normalized,
      ...patch,
      updatedAt: nowIso(),
    };
  });
  writeLocalRequests(updated);
}

async function tryRemoteCreate(listingId, note = '') {
  if (!isLoggedIn()) return null;
  const id = normalizeId(listingId);
  const attempts = [
    { path: '/requests', body: { listingId: id, note } },
    { path: '/requests', body: { listing_id: id, message: note } },
  ];
  for (const attempt of attempts) {
    try {
      const res = await apiFetch(attempt.path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attempt.body),
      });
      if (!res.ok) continue;
      const body = await res.json().catch(() => ({}));
      const item = body?.data?.request || body?.data || body?.request || null;
      return item ? normalizeRequest(item) : null;
    } catch {
      // try next
    }
  }
  return null;
}

export async function createTenantRequest(listing, note = '') {
  const tenant = getCurrentUserSnapshot();
  const listingId = normalizeId(listing?.listingId || listing?.listing_id);
  if (!tenant.userId || !listingId) {
    return { ok: false, error: 'Invalid tenant or listing info' };
  }

  const existing = listLocalTenantRequests(tenant.userId).find(
    (item) => item.listingId === listingId && ['PENDING', 'ACCEPTED'].includes(item.requestStatus)
  );
  if (existing) {
    return { ok: false, error: 'You already have an active request for this listing', request: existing };
  }

  const remote = await tryRemoteCreate(listingId, note);

  const localRequest = {
    requestId: remote?.requestId || crypto.randomUUID(),
    listingId,
    requestStatus: remote?.requestStatus || 'PENDING',
    tenantUserId: tenant.userId,
    ownerUserId: remote?.ownerUserId || '',
    requestedAt: remote?.requestedAt || nowIso(),
    updatedAt: remote?.updatedAt || nowIso(),
    note,
    listing: {
      listingId,
      rent: listing?.rent ?? null,
      areaName: listing?.areaName || null,
      roomCount: listing?.roomCount ?? null,
      primaryImageUrl: listing?.primaryImageUrl || null,
    },
    tenant: {
      userId: tenant.userId,
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
    },
    source: remote ? 'remote+local' : 'local',
  };

  savePublicProfileSnapshot({
    userId: tenant.userId,
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone,
    role: 'TENANT',
  });
  if (localRequest.ownerUserId) {
    savePublicProfileSnapshot({
      userId: localRequest.ownerUserId,
      role: 'OWNER',
    });
  }

  const list = readLocalRequests().map(normalizeRequest);
  list.unshift(localRequest);
  writeLocalRequests(list);

  return { ok: true, request: localRequest, remoteAvailable: Boolean(remote) };
}

export async function listTenantRequests() {
  const tenant = getCurrentUserSnapshot();
  if (!tenant.userId) return { items: [], remoteAvailable: false };

  const localItems = listLocalTenantRequests(tenant.userId);
  if (!isLoggedIn()) return { items: localItems, remoteAvailable: false };

  try {
    const res = await apiFetch('/requests/mine');
    if (!res.ok) return { items: localItems, remoteAvailable: false };
    const body = await res.json().catch(() => ({}));
    const rawItems = body?.data?.requests || body?.requests || body?.data || [];
    const remoteItems = Array.isArray(rawItems) ? rawItems.map(normalizeRequest) : [];
    const merged = new Map();
    [...remoteItems, ...localItems].forEach((item) => merged.set(item.requestId, item));
    return { items: Array.from(merged.values()), remoteAvailable: true };
  } catch {
    return { items: localItems, remoteAvailable: false };
  }
}

export async function listOwnerIncomingRequests(ownerListingIds = []) {
  const localItems = listLocalOwnerRequests(ownerListingIds);
  if (!isLoggedIn()) return { items: localItems, remoteAvailable: false };
  try {
    const res = await apiFetch('/requests/incoming');
    if (!res.ok) return { items: localItems, remoteAvailable: false };
    const body = await res.json().catch(() => ({}));
    const rawItems = body?.data?.requests || body?.requests || body?.data || [];
    const remoteItems = Array.isArray(rawItems) ? rawItems.map(normalizeRequest) : [];
    const merged = new Map();
    [...remoteItems, ...localItems].forEach((item) => merged.set(item.requestId, item));
    return { items: Array.from(merged.values()), remoteAvailable: true };
  } catch {
    return { items: localItems, remoteAvailable: false };
  }
}

export async function withdrawTenantRequest(requestId) {
  const id = normalizeId(requestId);
  let remoteAvailable = false;
  if (isLoggedIn()) {
    try {
      const res = await apiFetch(`/requests/${id}/withdraw`, { method: 'POST' });
      remoteAvailable = res.ok;
    } catch {
      remoteAvailable = false;
    }
  }
  updateLocalRequest(id, { requestStatus: 'WITHDRAWN' });
  return { ok: true, remoteAvailable };
}

export async function reviewOwnerRequest(requestId, decision) {
  const id = normalizeId(requestId);
  const normalizedDecision = decision === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
  const owner = getCurrentUserSnapshot();
  let remoteAvailable = false;
  if (isLoggedIn()) {
    try {
      const path = decision === 'ACCEPT' ? `/requests/${id}/accept` : `/requests/${id}/reject`;
      const res = await apiFetch(path, { method: 'POST' });
      remoteAvailable = res.ok;
    } catch {
      remoteAvailable = false;
    }
  }
  updateLocalRequest(id, { requestStatus: normalizedDecision });
  if (owner.userId) {
    savePublicProfileSnapshot({
      userId: owner.userId,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      role: 'OWNER',
    });
  }
  return { ok: true, remoteAvailable, status: normalizedDecision };
}

export async function getTenantRequestForListing(listingId) {
  const tenant = getCurrentUserSnapshot();
  if (!tenant.userId) return null;
  const items = listLocalTenantRequests(tenant.userId);
  const id = normalizeId(listingId);
  return items.find((item) => item.listingId === id) || null;
}

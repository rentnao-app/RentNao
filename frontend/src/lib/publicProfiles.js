import { getCurrentUser, getUserId } from './api';

const PROFILE_STORAGE_KEY = 'rentnao_public_profiles';
const REQUEST_STORAGE_KEY = 'rentnao_requests';

function normalizeId(value) {
  return String(value || '').trim();
}

function readProfiles() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeProfiles(data) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
}

function readRequests() {
  try {
    const raw = localStorage.getItem(REQUEST_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function maskEmail(value) {
  if (!value || !value.includes('@')) return value || 'N/A';
  const [name, domain] = value.split('@');
  if (!name) return value;
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(value) {
  if (!value) return 'N/A';
  const normalized = String(value);
  if (normalized.length <= 4) return normalized;
  return `${'*'.repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
}

export function savePublicProfileSnapshot(snapshot) {
  const userId = normalizeId(snapshot?.userId);
  if (!userId) return;

  const profiles = readProfiles();
  const prev = profiles[userId] || {};
  profiles[userId] = {
    ...prev,
    ...snapshot,
    userId,
    updatedAt: new Date().toISOString(),
  };
  writeProfiles(profiles);
}

export function getPublicProfileSnapshot(userId) {
  const id = normalizeId(userId);
  if (!id) return null;
  const profiles = readProfiles();
  return profiles[id] || null;
}

export function getPublicProfileData(userId) {
  const id = normalizeId(userId);
  const snapshot = getPublicProfileSnapshot(id);
  const requests = readRequests();

  const asTenant = requests.filter(
    (item) => normalizeId(item?.tenantUserId || item?.tenant_user_id) === id
  );
  const asOwner = requests.filter(
    (item) => normalizeId(item?.ownerUserId || item?.owner_user_id) === id
  );

  const tenantAccepted = asTenant.filter((item) => (item.requestStatus || item.request_status) === 'ACCEPTED').length;
  const ownerAccepted = asOwner.filter((item) => (item.requestStatus || item.request_status) === 'ACCEPTED').length;

  const interactions = [...asTenant, ...asOwner]
    .sort((a, b) => new Date(b.updatedAt || b.updated_at || b.requestedAt || b.requested_at || 0).getTime() - new Date(a.updatedAt || a.updated_at || a.requestedAt || a.requested_at || 0).getTime())
    .slice(0, 6)
    .map((item) => ({
      requestId: normalizeId(item.requestId || item.request_id),
      listingId: normalizeId(item.listingId || item.listing_id),
      status: item.requestStatus || item.request_status || 'UNKNOWN',
      timestamp: item.updatedAt || item.updated_at || item.requestedAt || item.requested_at || new Date().toISOString(),
    }));

  return {
    userId: id,
    snapshot,
    stats: {
      totalAsTenant: asTenant.length,
      totalAsOwner: asOwner.length,
      acceptedAsTenant: tenantAccepted,
      acceptedAsOwner: ownerAccepted,
      totalInteractions: asTenant.length + asOwner.length,
    },
    recentInteractions: interactions,
    display: {
      name: snapshot?.name || snapshot?.fullName || 'User',
      role: snapshot?.role || 'USER',
      emailMasked: maskEmail(snapshot?.email),
      phoneMasked: maskPhone(snapshot?.phone),
      area: snapshot?.area || snapshot?.currentArea || 'N/A',
      profession: snapshot?.profession || 'N/A',
      verificationStatus: snapshot?.verificationStatus || 'N/A',
    },
  };
}

export function ensureCurrentUserPublicSnapshot() {
  const user = getCurrentUser();
  const userId = normalizeId(getUserId(user));
  if (!userId) return;
  savePublicProfileSnapshot({
    userId,
    name: user?.username || user?.name || 'User',
    email: user?.contactEmail || user?.contact_email || user?.email || '',
    phone: user?.contactPhone || user?.contact_phone || '',
    role: user?.role || user?.userRole || '',
  });
}

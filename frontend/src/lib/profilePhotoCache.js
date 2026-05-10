const STORAGE_KEY = 'rentnao_profile_photos';
const CLOCK_SKEW_MS = 30000;

function normalizeId(value) {
  return String(value || '').trim();
}

function readCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const PROFILE_PHOTO_UPDATE_EVENT = 'rentnao-profile-photo-updated';

export function emitProfilePhotoUpdate(userId) {
  const id = normalizeId(userId);
  if (!id) return;
  window.dispatchEvent(new CustomEvent(PROFILE_PHOTO_UPDATE_EVENT, { detail: { userId: id } }));
}

export function getCachedProfilePhoto(userId) {
  const id = normalizeId(userId);
  if (!id) return null;
  const cache = readCache();
  const entry = cache[id];
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    delete cache[id];
    writeCache(cache);
    return null;
  }
  return entry;
}

export function setCachedProfilePhoto({ userId, profilePhotoKey, downloadUrl, expiresIn }) {
  const id = normalizeId(userId);
  if (!id || !downloadUrl) return;
  const cache = readCache();
  const ttlMs = Math.max(0, Number(expiresIn || 0) * 1000 - CLOCK_SKEW_MS);
  cache[id] = {
    userId: id,
    profilePhotoKey: profilePhotoKey || '',
    downloadUrl,
    expiresAt: ttlMs ? Date.now() + ttlMs : null,
  };
  writeCache(cache);
}

export function clearCachedProfilePhoto(userId) {
  const id = normalizeId(userId);
  if (!id) return;
  const cache = readCache();
  if (!cache[id]) return;
  delete cache[id];
  writeCache(cache);
}

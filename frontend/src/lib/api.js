/** Dev always uses same-origin requests (Vite proxy). Prod uses VITE_API_URL. */
function resolveApiUrl() {
  if (import.meta.env.DEV) {
    return '';
  }
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, '');
  return 'http://localhost:3000';
}

const API_URL = resolveApiUrl();

const ACCESS_TOKEN_KEY = 'rentnao_access_token';
const REFRESH_TOKEN_KEY = 'rentnao_refresh_token';
const USER_KEY = 'rentnao_user';

export function getApiUrl() {
  return API_URL;
}

export const AUTH_UPDATE_EVENT = 'rentnao-auth-update';

function notifyAuthListeners() {
  try {
    window.dispatchEvent(new CustomEvent(AUTH_UPDATE_EVENT));
  } catch {
    /* ignore */
  }
}

export function setAuthSession({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyAuthListeners();
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthListeners();
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getUserId(user) {
  return user?.userId || user?.user_id || user?.id || null;
}

export function getUserRole(user) {
  return user?.role || user?.userRole || null;
}

/** Display name for header / menus (login payload often omits nested profile). */
export function getUserDisplayName(user) {
  if (!user) return '';
  const p = user.profile || {};
  const fn = p.firstName ?? p.first_name;
  const ln = p.lastName ?? p.last_name;
  const full = [fn, ln].filter(Boolean).join(' ').trim();
  if (full) return full;
  return (
    user.username ||
    user.contactEmail ||
    user.contact_email ||
    user.contactPhone ||
    user.contact_phone ||
    user.email ||
    ''
  );
}

/** Two-letter avatar fallback when no photo URL is available. */
export function getUserInitials(user) {
  const label = getUserDisplayName(user);
  if (label) {
    const digits = String(label).replace(/\D/g, '');
    if (digits.length >= 11) return digits.slice(-2);
    const parts = String(label).trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts.length === 1 && parts[0].length) return parts[0].slice(0, 2).toUpperCase();
  }
  const phone = String(user?.contactPhone || user?.contact_phone || '').replace(/\D/g, '');
  if (phone.length >= 2) return phone.slice(-2);
  return '?';
}

export function isLoggedIn() {
  return !!getAccessToken();
}

export function logout() {
  clearAuthSession();
  window.location.href = '/login';
}

export async function apiFetch(path, options = {}) {
  const token = getAccessToken();
  const headers = {
    ...(options.headers || {}),
  };
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  return res;
}

export function getApiErrorMessage(body, fallback = 'Request failed') {
  return body?.error || body?.message || fallback;
}

/** Extract a user-facing message from a thrown Error, API body, or string. */
export function getRequestErrorMessage(err, fallback = 'Request failed') {
  if (!err) return fallback;
  if (typeof err === 'string') {
    const trimmed = err.trim();
    return trimmed || fallback;
  }
  if (err.body && typeof err.body === 'object') {
    const fromBody = getApiErrorMessage(err.body, '');
    if (fromBody) return fromBody;
  }
  const message = typeof err.message === 'string' ? err.message.trim() : '';
  if (
    message === 'Failed to fetch' ||
    message === 'NetworkError when attempting to fetch resource.' ||
    message === 'Load failed'
  ) {
    return fallback;
  }
  if (message) return message;
  return fallback;
}

export function isOwnerProfileMissingError(message) {
  return /owner profile not found/i.test(String(message || ''));
}

export function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || parts[0] || '',
  };
}

export function resolveOnboardingRoute(profileStatus, role, kycStatus) {
  if (profileStatus === 'PHONE_REQUIRED') return '/auth/phone-setup';
  if (profileStatus === 'PHONE_VERIFICATION_PENDING') return '/auth-verification?type=PHONE';
  if (profileStatus === 'UNDER_REVIEW') return '/verification-holding';
  if (profileStatus === 'PROFILE_PENDING') {
    return role === 'OWNER' ? '/owner-registration' : '/tenant-registration';
  }
  if (profileStatus === 'COMPLETED') {
    if (role === 'ADMIN') return '/admin-dashboard';
    if (kycStatus !== 'APPROVED') return '/verification-holding';
    if (role === 'OWNER') return '/owner-dashboard';
    return '/tenant-dashboard';
  }

  // Safe fallback when backend status is missing or unknown.
  if (role === 'ADMIN') return '/admin-dashboard';
  if (role === 'OWNER') return '/owner-dashboard';
  return '/tenant-dashboard';
}

export function extractProfileStatusPayload(body) {
  const data = body?.data || {};
  return {
    profileStatus: data?.onboardingStatus || data?.onboarding_status || null,
    role: data?.role || data?.userRole || data?.user_role || null,
    data,
  };
}

export async function fetchProfileStatus(userId) {
  const res = await apiFetch(`/users/${userId}/profile-status`);
  const body = await res.json().catch(() => ({}));
  return {
    res,
    body,
    ...extractProfileStatusPayload(body),
  };
}

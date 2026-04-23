const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ACCESS_TOKEN_KEY = 'rentnao_access_token';
const REFRESH_TOKEN_KEY = 'rentnao_refresh_token';
const USER_KEY = 'rentnao_user';

export function getApiUrl() {
  return API_URL;
}

export function setAuthSession({ accessToken, refreshToken, user }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
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

export function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ') || parts[0] || '',
  };
}

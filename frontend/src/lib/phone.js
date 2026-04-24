/**
 * Bangladesh mobile helpers (aligned with backend BD rules: 01[3-9] + 8 digits).
 * @see backend/src/modules/auth/utils/validators.ts
 */

const LOCAL_11_REGEX = /^01[3-9]\d{8}$/;
const DIGITS_880_13 = /^8801[3-9]\d{8}$/;

export function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

/** True when value is a complete valid 11-digit local mobile (01…). */
export function isValidBdMobileLocal11(value) {
  const d = digitsOnly(value);
  return LOCAL_11_REGEX.test(d) || DIGITS_880_13.test(d);
}

/** Returns +8801XXXXXXXXX or null. */
export function normalizeBdPhoneForApi(value) {
  const d = digitsOnly(value);
  if (LOCAL_11_REGEX.test(d)) return '+880' + d.slice(1);
  if (DIGITS_880_13.test(d)) return '+' + d;
  return null;
}

/** Normalizes to 01XXXXXXXXX when valid; otherwise best-effort local prefix for display. */
export function toLocal11Digits(value) {
  const d = digitsOnly(value);
  if (LOCAL_11_REGEX.test(d)) return d;
  if (DIGITS_880_13.test(d)) return '0' + d.slice(3);
  return '';
}

/** Ten digits after +880 for split inputs (e.g. 1712345678). */
export function local11ToAfter880(local11) {
  if (!LOCAL_11_REGEX.test(local11)) return '';
  return local11.slice(1);
}

export const SIGNUP_PHONE_STORAGE_KEY = 'rentnao_signup_phone';

export function rememberSignupPhoneLocal11(local11) {
  if (LOCAL_11_REGEX.test(local11)) {
    try {
      sessionStorage.setItem(SIGNUP_PHONE_STORAGE_KEY, local11);
    } catch {
      /* ignore */
    }
  }
}

export function consumeSignupPhoneLocal11() {
  try {
    const v = sessionStorage.getItem(SIGNUP_PHONE_STORAGE_KEY);
    sessionStorage.removeItem(SIGNUP_PHONE_STORAGE_KEY);
    return toLocal11Digits(v || '') || '';
  } catch {
    return '';
  }
}

export function clearPendingSignupPhone() {
  try {
    sessionStorage.removeItem(SIGNUP_PHONE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function clipPhoneInput(raw) {
  const d = digitsOnly(raw);
  if (d.startsWith('880')) return d.slice(0, 13);
  return d.slice(0, 11);
}

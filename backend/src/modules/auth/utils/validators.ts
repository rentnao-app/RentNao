/**
 * Reusable Zod validation and transformation helpers
 * for identifier (email/phone) validation
 */

/**
 * Bangladesh phone number regex
 * Matches: +8801XXXXXXXXX, 8801XXXXXXXXX, 01XXXXXXXXX
 */
const BD_PHONE_REGEX = /^(\+8801|8801|01)[3-9]\d{8}$/;

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates if a string is a valid email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validates if a string is a valid Bangladesh phone number
 * (after removing whitespace and hyphens)
 */
export function isValidBDPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return BD_PHONE_REGEX.test(cleaned);
}

/**
 * Normalizes Bangladesh phone number to international format (+8801XXXXXXXXX)
 * @param phone - Phone number in any BD format
 * @returns Normalized phone number
 */
export function normalizeBDPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  
  if (cleaned.startsWith('+880')) {
    return cleaned;
  } else if (cleaned.startsWith('880')) {
    return '+' + cleaned;
  } else if (cleaned.startsWith('01')) {
    return '+880' + cleaned.substring(1);
  }
  
  return cleaned; // Fallback (shouldn't reach here if validated)
}

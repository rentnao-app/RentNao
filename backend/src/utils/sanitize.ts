/**
 * Shared HTML sanitizer
 * Encodes HTML entities to prevent XSS in user-submitted text.
 *
 * Strategy: Entity-encode dangerous characters instead of trying to strip tags
 * with regex (which has known bypasses like unclosed tags, encoded payloads, etc).
 */

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#96;',
};

const HTML_CHARS_REGEX = /[&<>"'`/]/g;

export function sanitizeHtml(content: string): string {
  return content.replace(HTML_CHARS_REGEX, (char) => HTML_ENTITY_MAP[char] || char);
}

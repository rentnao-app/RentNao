/**
 * Shared HTML sanitizer
 * Strips HTML tags to prevent XSS in user-submitted text
 */

export function sanitizeHtml(content: string): string {
  return content.replace(/<[^>]*>?/gm, '');
}

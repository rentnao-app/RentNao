/**
 * Content filter for chat messages
 *
 * Strategy: Normalize → Detect → Block
 * 1. Normalize: Convert Bangla digits to ASCII, apply common substitution tricks, strip non-alphanumeric
 * 2. Detect: Run phone number and email regexes on normalized text
 * 3. Block: Return { blocked: true, reason } if detected
 *
 * The filter is intentionally aggressive — false positives are preferable to letting contact info through.
 */


// Bangla digit range: ০ (U+09E6) through ৯ (U+09EF)

const BANGLA_DIGIT_START = 0x09e6;


// Detection regexes (run on NORMALIZED text)


/** BD phone: 11 digits starting with 01[3-9], optionally prefixed with 88 */
const BD_PHONE_REGEX = /(?:88)?01[3-9]\d{8}/;

/** Fallback: any sequence of 7+ consecutive digits (catches international formats) */
const LONG_DIGIT_REGEX = /\d{7,}/;

/** Email: run on the ORIGINAL (un-stripped) text to preserve @ and dots */
const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;


// Normalization


/**
 * Normalize text for contact-info detection.
 * - Lowercase
 * - Convert Bangla digits (০-৯) to ASCII (0-9)
 * - Apply common character substitution tricks (o→0, i/l→1, s→5, b→8)
 * - Strip all non-alphanumeric characters (spaces, dashes, dots, parens)
 */
export function normalizeForDetection(text: string): string {
  let normalized = text.toLowerCase();

  // Bangla digits → ASCII digits
  normalized = normalized.replace(/[\u09E6-\u09EF]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - BANGLA_DIGIT_START + 48)
  );

  // Common substitution tricks
  normalized = normalized
    .replace(/o/g, '0')
    .replace(/[il]/g, '1')
    .replace(/s/g, '5')
    .replace(/b/g, '8');

  // Strip everything that isn't a letter or digit
  return normalized.replace(/[^a-z0-9]/g, '');
}


// Detection


export interface ContentFilterResult {
  blocked: boolean;
  reason?: string;
}

/**
 * Detect blocked content in a chat message.
 * Returns `{ blocked: false }` if clean, or `{ blocked: true, reason }` if contact info is found.
 */
export function detectBlockedContent(text: string): ContentFilterResult {
  // 1. Email check on original text (before stripping — needs @ and dots intact)
  if (EMAIL_REGEX.test(text.toLowerCase())) {
    return { blocked: true, reason: 'Messages cannot contain email addresses' };
  }

  // 2. Phone/digit checks on normalized + stripped text
  const normalized = normalizeForDetection(text);

  if (BD_PHONE_REGEX.test(normalized)) {
    return { blocked: true, reason: 'Messages cannot contain phone numbers' };
  }

  if (LONG_DIGIT_REGEX.test(normalized)) {
    return { blocked: true, reason: 'Messages cannot contain long number sequences' };
  }

  return { blocked: false };
}

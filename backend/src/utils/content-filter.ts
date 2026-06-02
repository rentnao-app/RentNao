/**
 * Content filter for chat messages
 *
 * Strategy: Normalize → Detect → Block
 * 1. Normalize: Convert ALL Unicode digit variants to ASCII, apply substitution tricks, strip non-alphanumeric
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


// Unicode digit ranges to normalize (start codepoint, length of 10)
// Covers: Bangla, Devanagari, Arabic-Indic, Extended Arabic-Indic,
// Fullwidth, Mathematical Bold/Double-Struck/Sans-Serif variants, etc.

const UNICODE_DIGIT_RANGES: [number, number][] = [
  [0x0660, 10],   // Arabic-Indic: ٠-٩
  [0x06F0, 10],   // Extended Arabic-Indic: ۰-۹
  [0x0966, 10],   // Devanagari: ०-९
  [0x09E6, 10],   // Bangla: ০-৯
  [0x0A66, 10],   // Gurmukhi: ੦-੯
  [0x0AE6, 10],   // Gujarati: ૦-૯
  [0x0B66, 10],   // Oriya: ୦-୯
  [0x0BE6, 10],   // Tamil: ௦-௯
  [0x0C66, 10],   // Telugu: ౦-౯
  [0x0CE6, 10],   // Kannada: ೦-೯
  [0x0D66, 10],   // Malayalam: ൦-൯
  [0x0E50, 10],   // Thai: ๐-๙
  [0x0ED0, 10],   // Lao: ໐-໙
  [0x0F20, 10],   // Tibetan: ༠-༩
  [0x1040, 10],   // Myanmar: ၀-၉
  [0xFF10, 10],   // Fullwidth: ０-９
  [0x1D7CE, 10],  // Mathematical Bold: 𝟎-𝟗
  [0x1D7D8, 10],  // Mathematical Double-Struck: 𝟘-𝟡
  [0x1D7E2, 10],  // Mathematical Sans-Serif: 𝟢-𝟫
  [0x1D7EC, 10],  // Mathematical Sans-Serif Bold: 𝟬-𝟵
  [0x1D7F6, 10],  // Mathematical Monospace: 𝟶-𝟿
];

// Enclosed digit mappings: ① ② ③ ... ⑨ ⓪
const ENCLOSED_DIGITS: Record<string, string> = {
  '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5',
  '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⓪': '0',
  '⓵': '1', '⓶': '2', '⓷': '3', '⓸': '4', '⓹': '5',
  '⓺': '6', '⓻': '7', '⓼': '8', '⓽': '9', '⓾': '10',
  '❶': '1', '❷': '2', '❸': '3', '❹': '4', '❺': '5',
  '❻': '6', '❼': '7', '❽': '8', '❾': '9', '❿': '10',
};

// Subscript and superscript digits
const SUB_SUPER_DIGITS: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4',
  '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};


// Normalization


/**
 * Build a regex that matches ALL known Unicode digit variants.
 */
function buildUnicodeDigitRegex(): RegExp {
  const ranges: string[] = [];
  for (const [start, len] of UNICODE_DIGIT_RANGES) {
    const end = start + len - 1;
    // For codepoints above 0xFFFF, we need to use the surrogate pair escape
    if (start > 0xFFFF) {
      // Handle supplementary plane characters individually
      for (let cp = start; cp <= end; cp++) {
        ranges.push(String.fromCodePoint(cp));
      }
    } else {
      ranges.push(
        `\\u${start.toString(16).padStart(4, '0')}-\\u${end.toString(16).padStart(4, '0')}`
      );
    }
  }

  // Build character class for BMP ranges
  const bmpRanges = UNICODE_DIGIT_RANGES
    .filter(([start]) => start <= 0xFFFF)
    .map(([start]) => {
      const end = start + 9;
      return `\\u${start.toString(16).padStart(4, '0')}-\\u${end.toString(16).padStart(4, '0')}`;
    });

  // Build alternation for supplementary plane characters
  const supplementaryChars = UNICODE_DIGIT_RANGES
    .filter(([start]) => start > 0xFFFF)
    .flatMap(([start]) => {
      const chars: string[] = [];
      for (let cp = start; cp < start + 10; cp++) {
        chars.push(String.fromCodePoint(cp));
      }
      return chars;
    });

  const enclosedChars = Object.keys(ENCLOSED_DIGITS).join('');
  const subSuperChars = Object.keys(SUB_SUPER_DIGITS).join('');

  let pattern = `[${bmpRanges.join('')}${enclosedChars}${subSuperChars}`;
  if (supplementaryChars.length > 0) {
    pattern += supplementaryChars.join('');
  }
  pattern += ']';

  return new RegExp(pattern, 'g');
}

const UNICODE_DIGIT_REGEX = buildUnicodeDigitRegex();

/**
 * Normalize text for contact-info detection.
 * - Lowercase
 * - Convert ALL Unicode digit variants (Bangla, Fullwidth, Mathematical, Enclosed, etc.) to ASCII
 * - Apply common character substitution tricks (o→0, i/l→1, s→5, b→8)
 * - Strip all non-alphanumeric characters (spaces, dashes, dots, parens)
 */
export function normalizeForDetection(text: string): string {
  let normalized = text.toLowerCase();

  // Replace enclosed digits
  for (const [char, digit] of Object.entries(ENCLOSED_DIGITS)) {
    normalized = normalized.replaceAll(char, digit);
  }

  // Replace sub/superscript digits
  for (const [char, digit] of Object.entries(SUB_SUPER_DIGITS)) {
    normalized = normalized.replaceAll(char, digit);
  }

  // Convert Unicode digit ranges to ASCII
  normalized = normalized.replace(UNICODE_DIGIT_REGEX, (ch) => {
    const cp = ch.codePointAt(0)!;
    for (const [start] of UNICODE_DIGIT_RANGES) {
      if (cp >= start && cp < start + 10) {
        return String(cp - start);
      }
    }
    return ch;
  });

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

/**
 * Transliteration Service — Shared Type Definitions
 *
 * These interfaces define the contract between the orchestrator and consumers.
 * They are intentionally decoupled from any ORM or controller types.
 */

/**
 * Raw English data input for transliteration.
 * All fields are optional — the orchestrator only processes fields that are present.
 */
export interface EnglishProfileData {
  nid?: string;
  phone?: string;
  floorNo?: string | number;
  flatNo?: string;

  fullName?: string;
  fatherName?: string;
  motherName?: string;
  propertyAddress?: string;
  profession?: string;
  religion?: string;
}

/**
 * Output after transliteration — every field gets a `_bn` suffix.
 * Values are null when the source field was absent or transliteration failed.
 */
export interface BanglaProfileData {
  // ── Numeric results ──
  nid_bn: string | null;
  phone_bn: string | null;
  floor_no_bn: string | null;
  flat_no_bn: string | null;

  // ── Phonetic results ──
  full_name_bn: string | null;
  father_name_bn: string | null;
  mother_name_bn: string | null;
  property_address_bn: string | null;
  profession_bn: string | null;
  religion_bn: string | null;
}

/**
 * Context passed to the background dispatcher so it knows
 * which DB table/row to UPDATE after transliteration completes.
 */
export interface TransliterationTarget {
  /** Which table holds the _bn columns */
  table: 'BaseUserProfile' | 'Property';
  /** The column name used as the WHERE key (e.g. 'user_id', 'property_id') */
  idColumn: string;
  /** The actual ID value */
  idValue: string;
}

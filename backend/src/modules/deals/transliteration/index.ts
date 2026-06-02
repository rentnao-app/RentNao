/**
 * Transliteration Service — Public API
 *
 * This is the sole entry point for consumers outside this directory.
 * It exports a single fire-and-forget function that:
 *   1. Generates Bengali translations (sync, in-process)
 *   2. Persists them to the database (async)
 *   3. Never throws — all errors are caught and logged
 *
 * Usage in a controller:
 *
 *   import { dispatchTransliteration } from '@/services/transliteration';
 *
 *   // After saving English data and before returning 201:
 *   dispatchTransliteration(
 *     { fullName: 'Rakib', phone: '01712345678', ... },
 *     { table: 'BaseUserProfile', idColumn: 'user_id', idValue: userId }
 *   );
 *   // ↑ No await — this floats as a background promise
 *
 *   return c.json({ success: true, ... }, 201);
 */

import { generateBanglaProfile, persistBanglaProfile } from './bangla-profile.service';
import type { EnglishProfileData, TransliterationTarget } from './types';

// Re-export types for consumer convenience
export type { EnglishProfileData, TransliterationTarget, BanglaProfileData } from './types';

// Re-export pure functions for direct use (e.g. in rent deed generation)
export { toBengaliDigits } from './numeric-mapper';
export { transliterateOne, transliterateBatch } from './phonetic-engine';
export { generateBanglaProfile } from './bangla-profile.service';

export function dispatchTransliteration(
  data: EnglishProfileData,
  target: TransliterationTarget,
): void {
  // Wrap the async work in an IIFE that catches everything
  (async () => {
    try {
      const startMs = performance.now();

      // Step 1: Generate Bengali equivalents (synchronous — no I/O)
      const bangla = generateBanglaProfile(data);

      // Step 2: Persist to database (async — single UPDATE query)
      await persistBanglaProfile(bangla, target);

      const elapsed = (performance.now() - startMs).toFixed(1);
      console.log(
        `[Transliteration] ✓ ${target.table}.${target.idColumn}=${target.idValue} (${elapsed}ms)`,
      );
    } catch (error: any) {
      // CRITICAL: Never propagate — the main process must not be affected
      console.error(
        `[Transliteration] ✗ Failed for ${target.table}.${target.idColumn}=${target.idValue}:`,
        {
          message: error?.message,
          code: error?.code,
          // Include input keys (not values) for debugging without leaking PII
          inputFields: Object.keys(data).filter(
            (k) => data[k as keyof EnglishProfileData] != null,
          ),
        },
      );
    }
  })();
}

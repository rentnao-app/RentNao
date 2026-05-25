/**
 * Module 2: Phonetic Transliteration Engine
 * The avro-phonetic engine runs entirely in-process with zero
 * network calls. It implements the Avro Phonetic keyboard algorithm
 */

const avro = require('nodejs-avro-phonetic');

export function transliterateOne(input: string): string | null {
  if (!input || !input.trim()) return null;
  try {
  
    const result = avro.parse(input.trim().toLowerCase());
    return typeof result === 'string' && result.length > 0 ? result : null;
  } catch {
    return null;
  }
}

export function transliterateBatch(inputs: (string | undefined | null)[]): (string | null)[] {
  return inputs.map((input) => {
    if (!input) return null;
    return transliterateOne(input);
  });
}

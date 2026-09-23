const avro = require('nodejs-avro-phonetic');

export function transliterateOne(input: string): string | null {
  if (!input || !input.trim()) return null;
  try {
    const safeInput = input.trim().slice(0, 255).toLowerCase();
    const result = avro.parse(safeInput);
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

const BENGALI_DIGIT_OFFSET = 0x09E6 - 0x0030; // 2486

export function toBengaliDigits(input: string): string {
  if (!input) return '';
  return input.replace(/[0-9]/g, (digit) =>
    String.fromCharCode(digit.charCodeAt(0) + BENGALI_DIGIT_OFFSET)
  );
}

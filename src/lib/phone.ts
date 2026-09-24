const MIN_DIGITS = 10;
const MAX_DIGITS = 15;
const RUSSIAN_DIGITS = 11;
const ALLOWED_CHARACTERS = /^[\d\s+()-]+$/u;

export function normalizePhone(input: string): string | null {
  const trimmed = input.trim();

  if (!ALLOWED_CHARACTERS.test(trimmed)) {
    return null;
  }

  const digits = trimmed.replaceAll(/\D/gu, '');

  if (digits.length < MIN_DIGITS || digits.length > MAX_DIGITS) {
    return null;
  }

  return !trimmed.startsWith('+') &&
    digits.length === RUSSIAN_DIGITS &&
    digits.startsWith('8')
    ? `7${digits.slice(1)}`
    : digits;
}

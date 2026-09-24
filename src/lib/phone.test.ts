import { describe, expect, it } from 'vitest';

import { normalizePhone } from './phone';

describe('normalizePhone', () => {
  it('strips formatting characters', () => {
    expect(normalizePhone('+7 (900) 123-45-67')).toBe('79001234567');
  });

  it('converts a leading 8 to 7 for russian numbers', () => {
    expect(normalizePhone('8 900 123 45 67')).toBe('79001234567');
  });

  it('keeps an international number as digits', () => {
    expect(normalizePhone('+357 99 123456')).toBe('35799123456');
  });

  it('rejects a number that is too short', () => {
    expect(normalizePhone('12345')).toBeNull();
  });

  it('rejects a string with no digits', () => {
    expect(normalizePhone('not a phone')).toBeNull();
  });

  it('rejects a number embedded in arbitrary text', () => {
    expect(normalizePhone('call me on 79001234567 today')).toBeNull();
  });

  it('leaves an international number with an explicit prefix alone', () => {
    expect(normalizePhone('+852 1234 5678')).toBe('85212345678');
  });
});

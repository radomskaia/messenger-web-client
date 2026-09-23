import { describe, expect, it } from 'vitest';

import { en } from './en';
import { ru } from './ru';

function flatten(source: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(source).flatMap(([key, value]) => {
    const path = prefix === '' ? key : `${prefix}.${key}`;

    return typeof value === 'object' && value !== null
      ? flatten(value as Record<string, unknown>, path)
      : [path];
  });
}

describe('locales', () => {
  it('defines the same keys in both languages', () => {
    expect(flatten(ru).toSorted((a, b) => a.localeCompare(b))).toEqual(
      flatten(en).toSorted((a, b) => a.localeCompare(b)),
    );
  });

  it('leaves no empty translation', () => {
    const values = [...Object.values(en), ...Object.values(ru)];

    expect(JSON.stringify(values)).not.toContain('""');
  });
});

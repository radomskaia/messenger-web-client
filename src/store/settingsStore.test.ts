import { beforeEach, describe, expect, it } from 'vitest';

import { useSettingsStore } from './settingsStore';

beforeEach(() => {
  localStorage.clear();
  useSettingsStore.setState({ language: 'en', theme: 'system' });
});

describe('settingsStore', () => {
  it('stores a chosen language', () => {
    useSettingsStore.getState().setLanguage('ru');

    expect(useSettingsStore.getState().language).toBe('ru');
  });

  it('stores a chosen theme', () => {
    useSettingsStore.getState().setTheme('dark');

    expect(useSettingsStore.getState().theme).toBe('dark');
  });

  it('rejects a persisted language that is not a supported one', async () => {
    localStorage.setItem(
      'messenger:settings',
      JSON.stringify({ state: { language: 'klingon', theme: 'system' }, version: 1 }),
    );
    await useSettingsStore.persist.rehydrate();

    expect(useSettingsStore.getState().language).not.toBe('klingon');
  });

  it('rejects a persisted theme that is not a supported one', async () => {
    localStorage.setItem(
      'messenger:settings',
      JSON.stringify({ state: { language: 'en', theme: 'neon' }, version: 1 }),
    );
    await useSettingsStore.persist.rehydrate();

    expect(useSettingsStore.getState().theme).toBe('system');
  });
});

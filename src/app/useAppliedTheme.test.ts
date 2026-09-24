import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { useSettingsStore } from '@/store/settingsStore';

import { useAppliedTheme } from './useAppliedTheme';

beforeEach(() => {
  delete document.documentElement.dataset['theme'];
  useSettingsStore.setState({ theme: 'system' });
});

describe('useAppliedTheme', () => {
  it('writes the explicit light preference onto the document', () => {
    useSettingsStore.setState({ theme: 'light' });
    renderHook(() => {
      useAppliedTheme();
    });

    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('writes the explicit dark preference onto the document', () => {
    useSettingsStore.setState({ theme: 'dark' });
    renderHook(() => {
      useAppliedTheme();
    });

    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('leaves the attribute off for the system preference so the media query decides', () => {
    renderHook(() => {
      useAppliedTheme();
    });

    expect(Object.hasOwn(document.documentElement.dataset, 'theme')).toBe(false);
  });
});

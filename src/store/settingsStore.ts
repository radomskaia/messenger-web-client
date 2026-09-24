import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'ru' | 'en';

export type ThemePreference = 'light' | 'dark' | 'system';

interface SettingsState {
  language: Language;
  theme: ThemePreference;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
}

const LANGUAGES = ['ru', 'en'] as const;
const THEMES = ['light', 'dark', 'system'] as const;

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as never);
}

function isThemePreference(value: unknown): value is ThemePreference {
  return THEMES.includes(value as never);
}

function detectLanguage(): Language {
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: detectLanguage(),
      theme: 'system',
      setLanguage: (language) => {
        set({ language });
      },
      setTheme: (theme) => {
        set({ theme });
      },
    }),
    {
      name: 'messenger:settings',
      version: 1,
      // Anything in localStorage is untrusted: it may be stale, hand-edited, or
      // written by an older shape. The compile-time unions prove nothing here.
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<SettingsState>;
        const { language, theme } = state;

        return {
          ...current,
          language: isLanguage(language) ? language : current.language,
          theme: isThemePreference(theme) ? theme : current.theme,
        };
      },
    },
  ),
);

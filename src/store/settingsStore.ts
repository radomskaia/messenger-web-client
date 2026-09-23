import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'ru' | 'en';

interface SettingsState {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LANGUAGES = ['ru', 'en'] as const;

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as never);
}

function detectLanguage(): Language {
  return navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: detectLanguage(),
      setLanguage: (language) => {
        set({ language });
      },
    }),
    {
      name: 'messenger:settings',
      version: 1,
      merge: (persisted, current) => {
        const state = (persisted ?? {}) as Partial<SettingsState>;
        const { language } = state;

        return {
          ...current,
          language: isLanguage(language) ? language : current.language,
        };
      },
    },
  ),
);

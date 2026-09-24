import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en } from '@/locales/en';
import { ru } from '@/locales/ru';
import { useSettingsStore } from '@/store/settingsStore';

// eslint-disable-next-line unicorn/no-top-level-side-effects
void i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: useSettingsStore.getState().language,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// eslint-disable-next-line unicorn/no-top-level-side-effects
useSettingsStore.subscribe((state) => {
  if (state.language !== i18next.language) {
    void i18next.changeLanguage(state.language);
  }
});

export { i18next };

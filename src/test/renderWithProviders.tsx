import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';

import { i18next } from '@/app/i18n';

import type { ReactElement } from 'react';

export function renderWithProviders(ui: ReactElement): ReturnType<typeof render> {
  if (i18next.language !== 'en') {
    void i18next.changeLanguage('en');
  }

  return render(<I18nextProvider i18n={i18next}>{ui}</I18nextProvider>);
}

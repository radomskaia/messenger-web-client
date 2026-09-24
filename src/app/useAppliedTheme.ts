import { useEffect } from 'react';

import { useSettingsStore } from '@/store/settingsStore';

export function useAppliedTheme(): void {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === 'system') {
      delete root.dataset['theme'];

      return;
    }

    root.dataset['theme'] = theme;
  }, [theme]);
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAutoHideScrollbar } from '@/app/useAutoHideScrollbar';
import { ChatList } from '@/components/ChatList/ChatList';
import { NewChatForm } from '@/components/NewChatForm/NewChatForm.tsx';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';

import styles from './Sidebar.module.css';

export function Sidebar() {
  const { t } = useTranslation();
  const signOut = useAuthStore((state) => state.signOut);
  const language = useSettingsStore((state) => state.language);
  const theme = useSettingsStore((state) => state.theme);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const [isCreating, setIsCreating] = useState(false);
  const chatsScrollRef = useAutoHideScrollbar<HTMLDivElement>();

  return (
    <aside className={styles['sidebar']}>
      <header className={styles['header']}>
        <h1 className={styles['heading']}>{t('chats.heading')}</h1>

        <select
          className={styles['select']}
          value={language}
          aria-label={t('settings.language')}
          onChange={(event) => {
            setLanguage(event.target.value === 'ru' ? 'ru' : 'en');
          }}
        >
          <option value="en">EN</option>
          <option value="ru">RU</option>
        </select>

        <select
          className={styles['select']}
          value={theme}
          aria-label={t('settings.themeLabel')}
          onChange={(event) => {
            const next = event.target.value;

            setTheme(next === 'light' || next === 'dark' ? next : 'system');
          }}
        >
          <option value="system">{t('settings.themeSystem')}</option>
          <option value="light">{t('settings.themeLight')}</option>
          <option value="dark">{t('settings.themeDark')}</option>
        </select>

        <button
          type="button"
          className={styles['signOut']}
          onClick={() => {
            signOut();
          }}
        >
          {t('settings.signOut')}
        </button>
      </header>

      <button
        type="button"
        className={styles['newChat']}
        onClick={() => {
          setIsCreating(true);
        }}
      >
        {t('chats.newChat')}
      </button>

      {isCreating && (
        <NewChatForm
          onClose={() => {
            setIsCreating(false);
          }}
        />
      )}

      <div
        ref={chatsScrollRef}
        className={styles['chats']}
      >
        <ChatList />
      </div>
    </aside>
  );
}

import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { ConnectionStatus } from '@/components/ConnectionStatus/ConnectionStatus';
import { MessageComposer } from '@/components/MessageComposer/MessageComposer';
import { MessageList } from '@/components/MessageList/MessageList';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { chatTitle } from '@/domain/mappers';
import { useChatsStore } from '@/store/chatsStore';

import styles from './ChatPage.module.css';

export function ChatPage() {
  const { t } = useTranslation();
  const activeChatId = useChatsStore((state) => state.activeChatId);
  const chats = useChatsStore((state) => state.chats);
  const setActiveChat = useChatsStore((state) => state.setActiveChat);
  const activeChat = activeChatId && chats[activeChatId];

  const leaveChat = useCallback(() => {
    setActiveChat(null);
  }, [setActiveChat]);

  useEffect(() => {
    if (!activeChatId) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('dialog[open]')) {
        return;
      }

      leaveChat();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeChatId, leaveChat]);

  return (
    <div
      className={styles['layout']}
      data-chat-open={!!activeChat}
    >
      <div
        className={styles['wallpaper']}
        aria-hidden="true"
      />
      <Sidebar />

      <main className={styles['thread']}>
        <ConnectionStatus />

        {activeChat ? (
          <>
            <header className={styles['header']}>
              <button
                type="button"
                className={styles['back']}
                aria-label={t('chats.back')}
                onClick={leaveChat}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M15 5l-7 7 7 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <h2 className={styles['title']}>{chatTitle(activeChat)}</h2>
            </header>
            <MessageList chatId={activeChat.chatId} />
            <footer className={styles['footer']}>
              <MessageComposer chatId={activeChat.chatId} />
            </footer>
          </>
        ) : (
          <p className={styles['placeholder']}>{t('chats.selectPrompt')}</p>
        )}
      </main>
    </div>
  );
}

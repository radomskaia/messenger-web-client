import { useTranslation } from 'react-i18next';

import { chatTitle } from '@/domain/mappers';
import { useChatsStore } from '@/store/chatsStore';

import styles from './ChatList.module.css';

/** The first character of a title, kept whole for emoji (a surrogate pair). */
function getInitial(value: string): string {
  const codePoint = value.codePointAt(0);

  return codePoint === undefined ? '' : String.fromCodePoint(codePoint);
}

export function ChatList() {
  const { t } = useTranslation();
  const chats = useChatsStore((state) => state.chats);
  const activeChatId = useChatsStore((state) => state.activeChatId);
  const messages = useChatsStore((state) => state.messages);
  const setActiveChat = useChatsStore((state) => state.setActiveChat);

  const ordered = Object.values(chats).toSorted(
    (left, right) => right.lastMessageAt - left.lastMessageAt,
  );

  if (ordered.length === 0) {
    return <p className={styles['empty']}>{t('chats.empty')}</p>;
  }

  return (
    <ul className={styles['list']}>
      {ordered.map((chat) => {
        const chatMessages = messages[chat.chatId] ?? [];
        const title = chatTitle(chat);
        const preview = chatMessages.at(-1)?.text ?? '';

        return (
          <li key={chat.chatId}>
            <button
              type="button"
              className={
                chat.chatId === activeChatId ? styles['rowActive'] : styles['row']
              }
              aria-current={chat.chatId === activeChatId}
              onClick={() => {
                setActiveChat(chat.chatId);
              }}
            >
              <span
                className={styles['avatar']}
                aria-hidden="true"
              >
                {getInitial(title).toUpperCase()}
              </span>
              <span className={styles['text']}>
                <span className={styles['title']}>{title}</span>
                <span className={styles['preview']}>{preview}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

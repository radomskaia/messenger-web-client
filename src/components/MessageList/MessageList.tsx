import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAutoHideScrollbar } from '@/app/useAutoHideScrollbar';
import { useChatsStore } from '@/store/chatsStore';

import { MessageBubble } from './MessageBubble';
import styles from './MessageList.module.css';

const AT_BOTTOM_THRESHOLD = 120;
const SCROLL_IDLE_MS = 350;

interface MessageListProperties {
  chatId: string;
}

export function MessageList({ chatId }: MessageListProperties) {
  const { t } = useTranslation();
  const messages = useChatsStore((state) => state.messages[chatId]) ?? [];
  const scrollRef = useAutoHideScrollbar<HTMLDivElement>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [showToBottom, setShowToBottom] = useState(false);

  const lastMessageId = messages.at(-1)?.idMessage;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [chatId, lastMessageId]);

  useEffect(
    () => () => {
      clearTimeout(idleTimerRef.current);
    },
    [],
  );

  const handleScroll = () => {
    setShowToBottom(false);
    clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      const element = scrollRef.current;

      if (!element) {
        return;
      }

      const distanceFromBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight;

      setShowToBottom(distanceFromBottom > AT_BOTTOM_THRESHOLD);
    }, SCROLL_IDLE_MS);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  };

  return (
    <div className={styles['container']}>
      <div
        ref={scrollRef}
        className={styles['scroll']}
        data-testid="message-scroll"
        onScroll={handleScroll}
      >
        <ul className={styles['list']}>
          {messages.map((message) => (
            <MessageBubble
              key={message.idMessage}
              message={message}
            />
          ))}
        </ul>
        <div ref={bottomRef} />
      </div>

      {showToBottom && (
        <button
          type="button"
          className={styles['toBottom']}
          aria-label={t('chats.toBottom')}
          onClick={scrollToBottom}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              d="M7 10l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

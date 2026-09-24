import { Fragment, useEffect, useRef, useState } from 'react';
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
  const unreadDivider = useChatsStore((state) => state.unreadDivider);
  const markChatRead = useChatsStore((state) => state.markChatRead);
  const dismissUnreadDivider = useChatsStore((state) => state.dismissUnreadDivider);
  const scrollRef = useAutoHideScrollbar<HTMLDivElement>();
  const dividerRef = useRef<HTMLLIElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const positionedChatRef = useRef<string | undefined>(undefined);
  const previousLastIdRef = useRef<string | undefined>(undefined);
  const [showToBottom, setShowToBottom] = useState(false);

  const messageCount = messages.length;
  const lastMessageId = messages.at(-1)?.idMessage;
  const dividerBeforeId =
    unreadDivider?.chatId === chatId ? unreadDivider.beforeId : null;

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    const isNewChat = positionedChatRef.current !== chatId;
    const isNewMessage = !isNewChat && lastMessageId !== previousLastIdRef.current;

    positionedChatRef.current = chatId;
    previousLastIdRef.current = lastMessageId;

    if (!isNewMessage && dividerRef.current) {
      element.scrollTop +=
        dividerRef.current.getBoundingClientRect().top -
        element.getBoundingClientRect().top;

      return;
    }

    element.scrollTop = element.scrollHeight;
  }, [chatId, lastMessageId, messageCount, scrollRef]);

  useEffect(
    () => () => {
      clearTimeout(idleTimerRef.current);
    },
    [],
  );

  const handleScroll = () => {
    setShowToBottom(false);
    clearTimeout(idleTimerRef.current);

    const element = scrollRef.current;
    const divider = dividerRef.current;

    if (element && divider) {
      const dividerRect = divider.getBoundingClientRect();
      const viewport = element.getBoundingClientRect();

      if (dividerRect.bottom < viewport.top || dividerRect.top > viewport.bottom) {
        dismissUnreadDivider();
      }
    }

    idleTimerRef.current = setTimeout(() => {
      if (!element) {
        return;
      }

      const distanceFromBottom =
        element.scrollHeight - element.scrollTop - element.clientHeight;
      const isAtBottom = distanceFromBottom <= AT_BOTTOM_THRESHOLD;

      setShowToBottom(!isAtBottom);

      if (isAtBottom) {
        markChatRead(chatId);
      }
    }, SCROLL_IDLE_MS);
  };

  const scrollToBottom = () => {
    const element = scrollRef.current;

    if (!element) {
      return;
    }

    if (typeof element.scrollTo === 'function') {
      element.scrollTo({ top: element.scrollHeight, behavior: 'smooth' });
    } else {
      element.scrollTop = element.scrollHeight;
    }
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
            <Fragment key={message.idMessage}>
              {message.idMessage === dividerBeforeId && (
                <li
                  ref={dividerRef}
                  className={styles['divider']}
                >
                  {t('chats.newMessages')}
                </li>
              )}
              <MessageBubble message={message} />
            </Fragment>
          ))}
        </ul>
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

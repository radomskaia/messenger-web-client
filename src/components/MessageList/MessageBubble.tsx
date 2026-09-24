import { useTranslation } from 'react-i18next';

import type { Message } from '@/domain/types';
import { formatTime } from '@/lib/time';

import styles from './MessageBubble.module.css';

interface MessageBubbleProperties {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProperties) {
  const { t, i18n } = useTranslation();

  return (
    <li className={message.direction === 'outgoing' ? styles['rowOut'] : styles['rowIn']}>
      <div
        className={
          message.direction === 'outgoing' ? styles['bubbleOut'] : styles['bubbleIn']
        }
      >
        <span className={styles['sender']}>
          {t(message.direction === 'outgoing' ? 'message.you' : 'message.contact')}
        </span>
        <p className={styles['text']}>{message.text}</p>
        <span className={styles['meta']}>
          {message.status === 'failed' && (
            <span className={styles['failed']}>{t('message.failed')}</span>
          )}
          <time dateTime={new Date(message.timestamp).toISOString()}>
            {formatTime(message.timestamp, i18n.language)}
          </time>
        </span>
      </div>
    </li>
  );
}

import { useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAutoHideScrollbar } from '@/app/useAutoHideScrollbar';
import { sendTextMessage } from '@/services/sendTextMessage';
import { useAuthStore } from '@/store/authStore';
import { useChatsStore } from '@/store/chatsStore';

import styles from './MessageComposer.module.css';

import type { KeyboardEvent } from 'react';

export const MESSAGE_LENGTH_LIMIT = 4096;

const COUNTER_MARGIN = 96;

interface MessageComposerProperties {
  chatId: string;
}

export function MessageComposer({ chatId }: MessageComposerProperties) {
  const { t } = useTranslation();
  const credentials = useAuthStore((state) => state.credentials);
  const [text, setText] = useState('');
  const fieldRef = useAutoHideScrollbar<HTMLTextAreaElement>();
  const dismissUnreadDivider = useChatsStore((state) => state.dismissUnreadDivider);

  const length = text.trim().length;
  const isTooLong = length > MESSAGE_LENGTH_LIMIT;
  const hasCounter = length >= MESSAGE_LENGTH_LIMIT - COUNTER_MARGIN;

  useLayoutEffect(() => {
    const field = fieldRef.current;

    if (!field) {
      return;
    }

    field.style.height = 'auto';
    const border = field.offsetHeight - field.clientHeight;
    const contentHeight = field.scrollHeight + border;
    // eslint-disable-next-line unicorn/prefer-number-coercion
    const cap = Number.parseFloat(getComputedStyle(field).maxHeight);
    field.style.height = `${String(Number.isNaN(cap) ? contentHeight : Math.min(contentHeight, cap))}px`;
  }, [text, fieldRef]);

  const submit = async () => {
    const trimmed = text.trim();

    if (!trimmed || isTooLong || !credentials) {
      return;
    }

    setText('');

    const wasSent = await sendTextMessage(credentials, chatId, trimmed);

    if (!wasSent) {
      setText((current) => current || trimmed);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();
    void submit();
  };

  return (
    <div className={styles['composer']}>
      <textarea
        ref={fieldRef}
        className={styles['field']}
        value={text}
        rows={1}
        placeholder={t('composer.placeholder')}
        onFocus={dismissUnreadDivider}
        onKeyDown={handleKeyDown}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <div className={styles['controls']}>
        {hasCounter && (
          <span
            className={styles['counter']}
            role="status"
          >
            <span className={isTooLong ? styles['over'] : undefined}>{length}</span>/
            {MESSAGE_LENGTH_LIMIT}
          </span>
        )}
        <button
          type="button"
          className={styles['send']}
          disabled={isTooLong}
          onClick={submit}
        >
          {t('composer.send')}
        </button>
      </div>
    </div>
  );
}

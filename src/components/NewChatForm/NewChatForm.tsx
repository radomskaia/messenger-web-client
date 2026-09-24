import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { checkAccount } from '@/api/methods';
import { normalizePhone } from '@/lib/phone';
import { useAuthStore } from '@/store/authStore';
import { useChatsStore } from '@/store/chatsStore';

import styles from './NewChatForm.module.css';

import type { SubmitEvent } from 'react';

interface NewChatFormProperties {
  onClose: () => void;
}

export function NewChatForm({ onClose }: NewChatFormProperties) {
  const { t } = useTranslation();
  const fieldId = useId();
  const isClosedRef = useRef(false);
  const credentials = useAuthStore((state) => state.credentials);
  const mergeChats = useChatsStore((state) => state.mergeChats);
  const setActiveChat = useChatsStore((state) => state.setActiveChat);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const close = () => {
    isClosedRef.current = true;
    onClose();
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = normalizePhone(phone);

    if (!normalized || !credentials) {
      setError(t('newChat.invalidPhone'));

      return;
    }

    setError(null);
    setIsChecking(true);

    try {
      const account = await checkAccount(credentials, normalized);

      if (isClosedRef.current) {
        return;
      }

      if (!account.exist || !account.chatId) {
        setError(t('newChat.notFound'));

        return;
      }

      mergeChats([
        {
          chatId: account.chatId,
          ...(account.username !== undefined && { username: account.username }),
          phoneNumber: Number(normalized),
          lastMessageAt: Date.now(),
        },
      ]);
      setActiveChat(account.chatId);
      close();
    } catch {
      setError(t('newChat.failed'));
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <form
      className={styles['dialog']}
      onSubmit={handleSubmit}
    >
      <h2 className={styles['heading']}>{t('newChat.heading')}</h2>

      <label
        className={styles['label']}
        htmlFor={fieldId}
      >
        {t('newChat.phone')}
      </label>
      <input
        id={fieldId}
        className={styles['input']}
        value={phone}
        placeholder={t('newChat.phonePlaceholder')}
        inputMode="tel"
        onChange={(event) => {
          setPhone(event.target.value);
        }}
      />

      {error !== null && (
        <p
          className={styles['error']}
          role="alert"
        >
          {error}
        </p>
      )}

      <div className={styles['actions']}>
        <button
          type="button"
          className={styles['cancel']}
          onClick={close}
        >
          {t('newChat.cancel')}
        </button>
        <button
          type="submit"
          className={styles['submit']}
          disabled={isChecking}
        >
          {t('newChat.submit')}
        </button>
      </div>
    </form>
  );
}

import { useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/store/authStore';

import styles from './LoginPage.module.css';

import type { SubmitEvent } from 'react';

const DEFAULT_API_URL = 'https://api.green-api.com';

export function LoginPage() {
  const { t } = useTranslation();
  const signIn = useAuthStore((state) => state.signIn);
  const idFieldId = useId();
  const tokenFieldId = useId();
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [error, setError] = useState<{ message: string; attempt: number } | null>(null);
  // eslint-disable-next-line unicorn/name-replacements
  const failedAttemptsRef = useRef(0);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedId = idInstance.trim();
    const trimmedToken = apiTokenInstance.trim();

    if (trimmedId === '' || trimmedToken === '') {
      failedAttemptsRef.current += 1;
      setError({ message: t('auth.required'), attempt: failedAttemptsRef.current });

      return;
    }

    setError(null);
    signIn({
      idInstance: trimmedId,
      apiTokenInstance: trimmedToken,
      apiUrl: DEFAULT_API_URL,
    });
  };

  return (
    <main className={styles['page']}>
      <form
        className={styles['card']}
        onSubmit={handleSubmit}
      >
        <h1 className={styles['heading']}>{t('auth.heading')}</h1>

        <label
          className={styles['label']}
          htmlFor={idFieldId}
        >
          {t('auth.idInstance')}
        </label>
        <input
          id={idFieldId}
          className={styles['input']}
          value={idInstance}
          autoComplete="off"
          onChange={(event) => {
            setIdInstance(event.target.value);
          }}
        />

        <label
          className={styles['label']}
          htmlFor={tokenFieldId}
        >
          {t('auth.apiToken')}
        </label>
        <input
          id={tokenFieldId}
          type="password"
          className={styles['input']}
          value={apiTokenInstance}
          autoComplete="off"
          onChange={(event) => {
            setApiTokenInstance(event.target.value);
          }}
        />

        {error !== null && (
          <p
            key={error.attempt}
            className={styles['error']}
            role="alert"
          >
            {error.message}
          </p>
        )}

        <button
          className={styles['submit']}
          type="submit"
        >
          {t('auth.submit')}
        </button>

        <p className={styles['hint']}>{t('auth.hint')}</p>
      </form>
    </main>
  );
}

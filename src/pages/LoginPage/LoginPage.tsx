import { useId, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useInstanceCheck } from '@/app/useInstanceCheck';
import type { Credentials } from '@/domain/types';
import { useAuthStore } from '@/store/authStore';

import styles from './LoginPage.module.css';

import type { SubmitEvent } from 'react';

const DEFAULT_API_URL = 'https://api.green-api.com';
const CONSOLE_URL = 'https://console.green-api.com/';

export function LoginPage() {
  const { t } = useTranslation();
  const signIn = useAuthStore((state) => state.signIn);
  const { dialog, checkInstance } = useInstanceCheck();
  const signOutReason = useAuthStore((state) => state.signOutReason);
  const idFieldId = useId();
  const tokenFieldId = useId();
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [error, setError] = useState<{ message: string; attempt: number } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  // eslint-disable-next-line unicorn/name-replacements
  const failedAttemptsRef = useRef(0);

  const showError = (message: string) => {
    failedAttemptsRef.current += 1;
    setError({ message, attempt: failedAttemptsRef.current });
  };

  const checkAndSignIn = async (credentials: Credentials) => {
    setIsChecking(true);
    const outcome = await checkInstance(credentials);
    setIsChecking(false);

    switch (outcome.status) {
      case 'ready': {
        signIn(credentials);
        break;
      }

      case 'declined': {
        showError(t('auth.webhookDeclined'));
        break;
      }

      case 'rejected': {
        showError(t('auth.unauthorized'));
        break;
      }

      case 'failed': {
        showError(t(outcome.reason));
        break;
      }

      case 'aborted': {
        break;
      }
    }
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isChecking) {
      return;
    }

    const trimmedId = idInstance.trim();
    const trimmedToken = apiTokenInstance.trim();

    if (!trimmedId || !trimmedToken) {
      showError(t('auth.required'));

      return;
    }

    setError(null);
    void checkAndSignIn({
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
        <p className={styles['intro']}>
          <Trans
            i18nKey="auth.console"
            components={{
              consoleLink: (
                // eslint-disable-next-line jsx-a11y/anchor-has-content -- Trans fills it in.
                <a
                  className={styles['link']}
                  href={CONSOLE_URL}
                  target="_blank"
                  rel="noreferrer"
                />
              ),
            }}
          />
        </p>

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

        {(error ?? signOutReason) && (
          <p
            key={error?.attempt}
            className={styles['error']}
            role="alert"
          >
            {error === null
              ? (t as (key: string) => string)(signOutReason ?? '')
              : error.message}
          </p>
        )}

        <button
          className={styles['submit']}
          type="submit"
          disabled={isChecking}
        >
          {t(isChecking ? 'auth.checking' : 'auth.submit')}
        </button>

        <p className={styles['hint']}>{t('auth.hint')}</p>
      </form>
      {dialog}
    </main>
  );
}

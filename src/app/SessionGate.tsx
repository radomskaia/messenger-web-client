import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useInstanceCheck } from '@/app/useInstanceCheck';
import type { InstanceCheckFailure } from '@/app/useInstanceCheck';
import { useAuthStore } from '@/store/authStore';

import styles from './SessionGate.module.css';

import type { ReactNode } from 'react';

export function SessionGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const credentials = useAuthStore((state) => state.credentials);
  const isVerified = useAuthStore((state) => state.isVerified);
  const markVerified = useAuthStore((state) => state.markVerified);
  const signOut = useAuthStore((state) => state.signOut);
  const { dialog, checkInstance } = useInstanceCheck();
  const [failure, setFailure] = useState<InstanceCheckFailure | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (credentials === null || isVerified) {
      return;
    }

    const controller = new AbortController();

    const check = async () => {
      const outcome = await checkInstance(credentials, controller.signal);

      switch (outcome.status) {
        case 'ready': {
          markVerified();
          break;
        }

        case 'declined':
        case 'rejected': {
          signOut();
          break;
        }

        case 'failed': {
          setFailure(outcome.reason);
          break;
        }

        case 'aborted': {
          break;
        }
      }
    };

    void check();

    return () => {
      controller.abort();
    };
  }, [credentials, isVerified, attempt, markVerified, signOut, checkInstance]);

  if (credentials === null || isVerified) {
    return children;
  }

  if (failure === null) {
    return (
      <main className={styles['page']}>
        <p
          className={styles['message']}
          role="status"
        >
          {t('session.checking')}
        </p>
        {dialog}
      </main>
    );
  }

  return (
    <main className={styles['page']}>
      <p
        className={styles['error']}
        role="alert"
      >
        {t(failure)}
      </p>
      <div className={styles['actions']}>
        <button
          className={styles['primary']}
          type="button"
          onClick={() => {
            setFailure(null);
            setAttempt((current) => current + 1);
          }}
        >
          {t('session.retry')}
        </button>
        <button
          className={styles['secondary']}
          type="button"
          onClick={signOut}
        >
          {t('session.signOut')}
        </button>
      </div>
    </main>
  );
}

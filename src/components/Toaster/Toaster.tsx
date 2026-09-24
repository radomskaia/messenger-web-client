import { useTranslation } from 'react-i18next';

import { useToastStore } from '@/store/toastStore';

import styles from './Toaster.module.css';

export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className={styles['container']}
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={styles['toast']}
          onClick={() => {
            dismiss(toast.id);
          }}
        >
          {(t as (key: string) => string)(toast.messageKey)}
        </button>
      ))}
    </div>
  );
}

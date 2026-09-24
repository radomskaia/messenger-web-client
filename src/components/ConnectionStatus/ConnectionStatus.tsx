import { useTranslation } from 'react-i18next';

import { useConnectionStore } from '@/store/connectionStore';

import styles from './ConnectionStatus.module.css';

export function ConnectionStatus() {
  const { t } = useTranslation();
  const status = useConnectionStore((state) => state.status);

  if (status !== 'reconnecting') {
    return null;
  }

  return (
    <p
      className={styles['banner']}
      role="status"
    >
      {t('connection.reconnecting')}
    </p>
  );
}

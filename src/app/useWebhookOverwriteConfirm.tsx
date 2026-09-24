import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useConfirmDialog } from '@/components/ConfirmDialog/useConfirmDialog';

import styles from './WebhookOverwrite.module.css';

export function useWebhookOverwriteConfirm() {
  const { t } = useTranslation();
  const { dialog, confirm } = useConfirmDialog();

  const confirmWebhookOverwrite = useCallback(
    (url: string) =>
      confirm({
        title: t('auth.webhookDialog.title'),
        body: (
          <>
            <p className={styles['paragraph']}>{t('auth.webhookDialog.current')}</p>
            <p className={styles['url']}>{url}</p>
            <p className={styles['paragraph']}>{t('auth.webhookDialog.consequence')}</p>
          </>
        ),
        confirmLabel: t('auth.webhookDialog.confirm'),
        cancelLabel: t('auth.webhookDialog.cancel'),
      }),
    [confirm, t],
  );

  return { dialog, confirmWebhookOverwrite };
}

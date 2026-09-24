import { useCallback } from 'react';

import { isRejectedCredentials, NetworkError } from '@/api/errors';
import { useWebhookOverwriteConfirm } from '@/app/useWebhookOverwriteConfirm';
import type { Credentials } from '@/domain/types';
import { prepareInstance } from '@/services/prepareInstance';

export type InstanceCheckFailure = 'auth.network' | 'auth.failed';

export type InstanceCheckOutcome =
  | { status: 'ready' }
  | { status: 'declined' }
  | { status: 'rejected' }
  | { status: 'failed'; reason: InstanceCheckFailure }
  | { status: 'aborted' };

export function useInstanceCheck() {
  const { dialog, confirmWebhookOverwrite } = useWebhookOverwriteConfirm();

  const checkInstance = useCallback(
    async (
      credentials: Credentials,
      signal?: AbortSignal,
    ): Promise<InstanceCheckOutcome> => {
      try {
        const result = await prepareInstance(credentials, {
          confirmWebhookOverwrite,
          ...(signal !== undefined && { signal }),
        });

        return { status: result.status === 'declined' ? 'declined' : 'ready' };
      } catch (error) {
        if (signal?.aborted === true) {
          return { status: 'aborted' };
        }

        if (isRejectedCredentials(error)) {
          return { status: 'rejected' };
        }

        return {
          status: 'failed',
          reason: error instanceof NetworkError ? 'auth.network' : 'auth.failed',
        };
      }
    },
    [confirmWebhookOverwrite],
  );

  return { dialog, checkInstance };
}

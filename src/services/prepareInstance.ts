import { getSettings, setSettings } from '@/api/methods';
import { planHttpApiSetup } from '@/domain/instanceSettings';
import type { Credentials } from '@/domain/types';

export type PrepareInstanceResult =
  { status: 'ready' } | { status: 'configured' } | { status: 'declined' };

export interface PrepareInstanceOptions {
  confirmWebhookOverwrite: (currentUrl: string) => Promise<boolean>;
  signal?: AbortSignal;
}

export async function prepareInstance(
  credentials: Credentials,
  options: PrepareInstanceOptions,
): Promise<PrepareInstanceResult> {
  const requestOptions = options.signal === undefined ? {} : { signal: options.signal };
  const settings = await getSettings(credentials, requestOptions);
  const plan = planHttpApiSetup(settings);

  if (plan.status === 'ready') {
    return { status: 'ready' };
  }

  if (plan.overwritesWebhookUrl) {
    const isConfirmed = await options.confirmWebhookOverwrite(settings.webhookUrl);

    if (!isConfirmed) {
      return { status: 'declined' };
    }
  }

  await setSettings(credentials, plan.patch, requestOptions);

  return { status: 'configured' };
}

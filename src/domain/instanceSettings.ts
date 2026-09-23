import type { InstanceSettings, SettingsPatch } from '@/api/types';

const REQUIRED_SETTINGS = {
  webhookUrl: '',
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  stateWebhook: 'yes',
} as const satisfies SettingsPatch;

export type InstanceSetupPlan =
  | { status: 'ready' }
  | {
      status: 'needsChanges';
      patch: SettingsPatch;
      overwritesWebhookUrl: boolean;
    };

export function planHttpApiSetup(settings: InstanceSettings): InstanceSetupPlan {
  const patch: SettingsPatch = {};

  if (settings.webhookUrl !== REQUIRED_SETTINGS.webhookUrl) {
    patch.webhookUrl = REQUIRED_SETTINGS.webhookUrl;
  }

  if (settings.incomingWebhook !== REQUIRED_SETTINGS.incomingWebhook) {
    patch.incomingWebhook = REQUIRED_SETTINGS.incomingWebhook;
  }

  if (settings.outgoingWebhook !== REQUIRED_SETTINGS.outgoingWebhook) {
    patch.outgoingWebhook = REQUIRED_SETTINGS.outgoingWebhook;
  }

  if (settings.stateWebhook !== REQUIRED_SETTINGS.stateWebhook) {
    patch.stateWebhook = REQUIRED_SETTINGS.stateWebhook;
  }

  if (Object.keys(patch).length === 0) {
    return { status: 'ready' };
  }

  return {
    status: 'needsChanges',
    patch,
    overwritesWebhookUrl: settings.webhookUrl !== '',
  };
}

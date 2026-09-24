import type { InstanceSettings } from '@/api/types';

/** An instance that already delivers every notification this client needs. */
export const configuredInstanceSettings: InstanceSettings = {
  wid: '79876543210@c.us',
  typeInstance: 'whatsapp',
  webhookUrl: '',
  webhookUrlToken: '',
  delaySendMessagesMilliseconds: 500,
  markIncomingMessagesReaded: 'no',
  markIncomingMessagesReadedOnReply: 'no',
  outgoingWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
  outgoingAPIMessageWebhook: 'yes',
  incomingWebhook: 'yes',
  stateWebhook: 'yes',
  keepOnlineStatus: 'no',
  editedMessageWebhook: 'yes',
  deletedMessageWebhook: 'yes',
};

import { describe, expect, it } from 'vitest';

import type { InstanceSettings } from '@/api/types';

import { planHttpApiSetup } from './instanceSettings';

const configured: InstanceSettings = {
  wid: '79876543210@c.us',
  typeInstance: 'telegram',
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

describe('planHttpApiSetup', () => {
  it('leaves a configured instance alone', () => {
    expect(planHttpApiSetup(configured)).toEqual({ status: 'ready' });
  });

  it('asks only for the settings that differ', () => {
    expect(planHttpApiSetup({ ...configured, incomingWebhook: 'no' })).toEqual({
      status: 'needsChanges',
      patch: { incomingWebhook: 'yes' },
      overwritesWebhookUrl: false,
    });
  });

  it('clears a webhook url, which is what sends notifications elsewhere', () => {
    expect(
      planHttpApiSetup({ ...configured, webhookUrl: 'https://mysite.test' }),
    ).toEqual({
      status: 'needsChanges',
      patch: { webhookUrl: '' },
      overwritesWebhookUrl: true,
    });
  });

  it('flags a webhook url so the user can be warned before it is erased', () => {
    const plan = planHttpApiSetup({
      ...configured,
      webhookUrl: 'https://mysite.test',
      stateWebhook: 'no',
    });

    expect(plan).toMatchObject({ overwritesWebhookUrl: true });
  });

  it('asks for every required setting on an unconfigured instance', () => {
    expect(
      planHttpApiSetup({
        ...configured,
        incomingWebhook: 'no',
        outgoingWebhook: 'no',
        stateWebhook: 'no',
      }),
    ).toEqual({
      status: 'needsChanges',
      patch: { incomingWebhook: 'yes', outgoingWebhook: 'yes', stateWebhook: 'yes' },
      overwritesWebhookUrl: false,
    });
  });

  it('does not touch settings the client has no business changing', () => {
    const plan = planHttpApiSetup({
      ...configured,
      incomingWebhook: 'no',
      delaySendMessagesMilliseconds: 3000,
      keepOnlineStatus: 'yes',
    });

    expect(plan).toEqual({
      status: 'needsChanges',
      patch: { incomingWebhook: 'yes' },
      overwritesWebhookUrl: false,
    });
  });
});

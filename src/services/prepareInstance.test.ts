import { afterEach, describe, expect, it, vi } from 'vitest';

import { GreenApiError } from '@/api/errors';
import * as methods from '@/api/methods';
import type { Credentials } from '@/domain/types';
import { configuredInstanceSettings as configured } from '@/test/instanceSettings';

import { prepareInstance } from './prepareInstance';

const credentials: Credentials = {
  idInstance: '1',
  apiTokenInstance: 't',
  apiUrl: 'https://api.green-api.com',
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('prepareInstance', () => {
  it('leaves a configured instance untouched', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue(configured);
    const setSettings = vi.spyOn(methods, 'setSettings').mockResolvedValue();
    const confirmWebhookOverwrite = vi.fn();

    await expect(
      prepareInstance(credentials, { confirmWebhookOverwrite }),
    ).resolves.toEqual({
      status: 'ready',
    });
    expect(setSettings).not.toHaveBeenCalled();
    expect(confirmWebhookOverwrite).not.toHaveBeenCalled();
  });

  it('turns on missing notifications without asking', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue({
      ...configured,
      incomingWebhook: 'no',
    });
    const setSettings = vi.spyOn(methods, 'setSettings').mockResolvedValue();
    const confirmWebhookOverwrite = vi.fn();

    await expect(
      prepareInstance(credentials, { confirmWebhookOverwrite }),
    ).resolves.toEqual({
      status: 'configured',
    });
    expect(setSettings).toHaveBeenCalledWith(
      credentials,
      { incomingWebhook: 'yes' },
      expect.anything(),
    );
    expect(confirmWebhookOverwrite).not.toHaveBeenCalled();
  });

  it('clears somebody else’s webhook url once the user agrees', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue({
      ...configured,
      webhookUrl: 'https://crm.test/hook',
    });
    const setSettings = vi.spyOn(methods, 'setSettings').mockResolvedValue();
    const confirmWebhookOverwrite = vi.fn().mockResolvedValue(true);

    await expect(
      prepareInstance(credentials, { confirmWebhookOverwrite }),
    ).resolves.toEqual({
      status: 'configured',
    });
    expect(confirmWebhookOverwrite).toHaveBeenCalledWith('https://crm.test/hook');
    expect(setSettings).toHaveBeenCalledWith(
      credentials,
      { webhookUrl: '' },
      expect.anything(),
    );
  });

  it('changes nothing when the user keeps the existing webhook url', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue({
      ...configured,
      webhookUrl: 'https://crm.test/hook',
      incomingWebhook: 'no',
    });
    const setSettings = vi.spyOn(methods, 'setSettings').mockResolvedValue();
    const confirmWebhookOverwrite = vi.fn().mockResolvedValue(false);

    await expect(
      prepareInstance(credentials, { confirmWebhookOverwrite }),
    ).resolves.toEqual({
      status: 'declined',
    });
    expect(setSettings).not.toHaveBeenCalled();
  });

  it('lets a rejected token surface to the caller', async () => {
    vi.spyOn(methods, 'getSettings').mockRejectedValue(
      new GreenApiError(401, 'Unauthorized'),
    );
    const setSettings = vi.spyOn(methods, 'setSettings').mockResolvedValue();

    await expect(
      prepareInstance(credentials, { confirmWebhookOverwrite: vi.fn() }),
    ).rejects.toBeInstanceOf(GreenApiError);
    expect(setSettings).not.toHaveBeenCalled();
  });

  it('cancels its requests through the given signal', async () => {
    const getSettings = vi
      .spyOn(methods, 'getSettings')
      .mockResolvedValue({ ...configured, incomingWebhook: 'no' });
    const setSettings = vi.spyOn(methods, 'setSettings').mockResolvedValue();
    const { signal } = new AbortController();

    await prepareInstance(credentials, { confirmWebhookOverwrite: vi.fn(), signal });

    expect(getSettings).toHaveBeenCalledWith(credentials, { signal });
    expect(setSettings).toHaveBeenCalledWith(
      credentials,
      { incomingWebhook: 'yes' },
      { signal },
    );
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GreenApiError, NetworkError } from '@/api/errors';
import * as methods from '@/api/methods';
import type { Credentials } from '@/domain/types';
import { configuredInstanceSettings } from '@/test/instanceSettings';
import { renderWithProviders } from '@/test/renderWithProviders';

import { useInstanceCheck } from './useInstanceCheck';

const credentials: Credentials = {
  idInstance: '1',
  apiTokenInstance: 't',
  apiUrl: 'https://api.green-api.com',
};

/** Renders the hook's dialog and hands back its `checkInstance`. */
function mountCheck() {
  let checkInstance: ReturnType<typeof useInstanceCheck>['checkInstance'] | undefined;

  function Harness() {
    const check = useInstanceCheck();
    checkInstance = check.checkInstance;

    return check.dialog;
  }

  renderWithProviders(<Harness />);

  if (checkInstance === undefined) {
    throw new Error('Harness did not render');
  }

  return checkInstance;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useInstanceCheck', () => {
  it('reports a configured instance as ready', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue(configuredInstanceSettings);

    await expect(mountCheck()(credentials)).resolves.toEqual({ status: 'ready' });
  });

  it('reports an instance it had to set up as ready', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue({
      ...configuredInstanceSettings,
      stateWebhook: 'no',
    });
    vi.spyOn(methods, 'setSettings').mockResolvedValue();

    await expect(mountCheck()(credentials)).resolves.toEqual({ status: 'ready' });
  });

  it('asks in its dialog and reports a refusal', async () => {
    vi.spyOn(methods, 'getSettings').mockResolvedValue({
      ...configuredInstanceSettings,
      webhookUrl: 'https://crm.test/hook',
    });
    const user = userEvent.setup();
    const outcome = mountCheck()(credentials);

    await user.click(await screen.findByRole('button', { name: 'Keep it there' }));

    await expect(outcome).resolves.toEqual({ status: 'declined' });
  });

  it('reports credentials GREEN-API refused', async () => {
    vi.spyOn(methods, 'getSettings').mockRejectedValue(
      new GreenApiError(401, 'Unauthorized'),
    );

    await expect(mountCheck()(credentials)).resolves.toEqual({ status: 'rejected' });
  });

  it('reports an unreachable GREEN-API as a network failure', async () => {
    vi.spyOn(methods, 'getSettings').mockRejectedValue(
      new NetworkError(new TypeError('Failed to fetch')),
    );

    await expect(mountCheck()(credentials)).resolves.toEqual({
      status: 'failed',
      reason: 'auth.network',
    });
  });

  it('reports any other error as a generic failure', async () => {
    vi.spyOn(methods, 'getSettings').mockRejectedValue(new GreenApiError(500, 'oops'));

    await expect(mountCheck()(credentials)).resolves.toEqual({
      status: 'failed',
      reason: 'auth.failed',
    });
  });

  it('reports a cancelled check as aborted, not as a network failure', async () => {
    const controller = new AbortController();
    vi.spyOn(methods, 'getSettings').mockImplementation(() => {
      controller.abort();

      // fetch rejects like this once its signal fires; the client wraps it.
      return Promise.reject(new NetworkError(new DOMException('Aborted', 'AbortError')));
    });

    await expect(mountCheck()(credentials, controller.signal)).resolves.toEqual({
      status: 'aborted',
    });
  });

  it('passes its signal down to the requests', async () => {
    const getSettings = vi
      .spyOn(methods, 'getSettings')
      .mockResolvedValue(configuredInstanceSettings);
    const { signal } = new AbortController();

    await mountCheck()(credentials, signal);

    expect(getSettings).toHaveBeenCalledWith(credentials, { signal });
  });
});

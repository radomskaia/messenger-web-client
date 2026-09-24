import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as methods from '@/api/methods';
import type { Credentials } from '@/domain/types';

import { startPolling } from './notificationPolling';

const credentials: Credentials = {
  idInstance: '1',
  apiTokenInstance: 't',
  apiUrl: 'https://api.green-api.com',
};

const options = { receiveTimeoutSeconds: 1, initialBackoffMs: 0, maxBackoffMs: 0 };

function envelope(receiptId: number) {
  return { receiptId, body: { typeWebhook: 'incomingMessageReceived' } };
}

/**
 * Lets the polling loop run a few turns, then stops it. Each turn yields a
 * macrotask, not just a microtask: the backoff between retries is a
 * `setTimeout`, and draining microtasks alone would never let it fire.
 */
async function runBriefly(stop: () => void): Promise<void> {
  for (let turn = 0; turn < 10; turn += 1) {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }

  stop();
  await new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('startPolling', () => {
  it('hands each notification body to the handler', async () => {
    vi.spyOn(methods, 'receiveNotification')
      .mockResolvedValueOnce(envelope(1))
      .mockResolvedValue(null);
    vi.spyOn(methods, 'deleteNotification').mockResolvedValue();
    const onNotification = vi.fn();

    const stop = startPolling(
      credentials,
      { onNotification, onConnectionChange: vi.fn() },
      options,
    );
    await runBriefly(stop);

    expect(onNotification).toHaveBeenCalledWith({
      typeWebhook: 'incomingMessageReceived',
    });
  });

  it('acknowledges the notification after handling it', async () => {
    vi.spyOn(methods, 'receiveNotification')
      .mockResolvedValueOnce(envelope(7))
      .mockResolvedValue(null);
    const remove = vi.spyOn(methods, 'deleteNotification').mockResolvedValue();

    const stop = startPolling(
      credentials,
      { onNotification: vi.fn(), onConnectionChange: vi.fn() },
      options,
    );
    await runBriefly(stop);

    expect(remove).toHaveBeenCalledWith(credentials, 7);
  });

  it('acknowledges the notification even when the handler throws', async () => {
    vi.spyOn(methods, 'receiveNotification')
      .mockResolvedValueOnce(envelope(7))
      .mockResolvedValue(null);
    const remove = vi.spyOn(methods, 'deleteNotification').mockResolvedValue();
    const onNotification = vi.fn(() => {
      throw new Error('render blew up');
    });

    const stop = startPolling(
      credentials,
      { onNotification, onConnectionChange: vi.fn() },
      options,
    );
    await runBriefly(stop);

    expect(remove).toHaveBeenCalledWith(credentials, 7);
  });

  it('does not hand over the next notification until the previous one is acknowledged', async () => {
    const queue = [
      { receiptId: 1, body: { idMessage: 'm-1' } },
      { receiptId: 2, body: { idMessage: 'm-2' } },
    ];

    vi.spyOn(methods, 'receiveNotification').mockImplementation(() =>
      Promise.resolve(queue[0] ?? null),
    );
    vi.spyOn(methods, 'deleteNotification').mockImplementation(
      (_credentials, receiptId) => {
        if (queue[0]?.receiptId === receiptId) {
          queue.shift();
        }

        return Promise.resolve();
      },
    );

    const seen: string[] = [];
    const onNotification = vi.fn((body: unknown) => {
      seen.push((body as { idMessage: string }).idMessage);

      throw new Error('handler blew up');
    });

    const stop = startPolling(
      credentials,
      { onNotification, onConnectionChange: vi.fn() },
      options,
    );
    await runBriefly(stop);

    expect(seen).toEqual(['m-1', 'm-2']);
  });

  it('keeps polling after a network error', async () => {
    const receive = vi
      .spyOn(methods, 'receiveNotification')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(null);

    const stop = startPolling(
      credentials,
      { onNotification: vi.fn(), onConnectionChange: vi.fn() },
      options,
    );
    await runBriefly(stop);

    expect(receive.mock.calls.length).toBeGreaterThan(1);
  });

  it('reports the error so the caller can react to an expired token', async () => {
    const failure = new Error('unauthorized');
    vi.spyOn(methods, 'receiveNotification')
      .mockRejectedValueOnce(failure)
      .mockResolvedValue(null);
    const onError = vi.fn();

    const stop = startPolling(
      credentials,
      { onNotification: vi.fn(), onConnectionChange: vi.fn(), onError },
      options,
    );
    await runBriefly(stop);

    expect(onError).toHaveBeenCalledWith(failure);
  });

  it('stops polling once the returned function is called', async () => {
    const receive = vi.spyOn(methods, 'receiveNotification').mockResolvedValue(null);

    const stop = startPolling(
      credentials,
      { onNotification: vi.fn(), onConnectionChange: vi.fn() },
      options,
    );
    await runBriefly(stop);
    const callsAtStop = receive.mock.calls.length;

    for (let turn = 0; turn < 10; turn += 1) {
      await new Promise((resolve) => {
        setTimeout(resolve, 0);
      });
    }

    expect(receive.mock.calls.length).toBe(callsAtStop);
  });
});

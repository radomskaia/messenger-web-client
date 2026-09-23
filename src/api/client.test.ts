import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Credentials } from '@/domain/types';

import { buildUrl, request } from './client';
import { GreenApiError } from './errors';

const credentials: Credentials = {
  idInstance: '1101000001',
  apiTokenInstance: 'token123',
  apiUrl: 'https://api.green-api.com',
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('buildUrl', () => {
  it('composes the instance path and the token', () => {
    expect(buildUrl(credentials, 'sendMessage')).toBe(
      'https://api.green-api.com/waInstance1101000001/sendMessage/token123',
    );
  });

  it('appends extra segments after the token', () => {
    expect(buildUrl(credentials, 'deleteNotification', ['42'])).toBe(
      'https://api.green-api.com/waInstance1101000001/deleteNotification/token123/42',
    );
  });

  it('appends search parameters', () => {
    expect(
      buildUrl(credentials, 'receiveNotification', [], { receiveTimeout: '20' }),
    ).toBe(
      'https://api.green-api.com/waInstance1101000001/receiveNotification/token123?receiveTimeout=20',
    );
  });
});

describe('request', () => {
  it('returns parsed JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"idMessage":"7"}', { status: 200 })),
    );

    const result = await request<{ idMessage: string }>({
      credentials,
      method: 'POST',
      endpoint: 'sendMessage',
      body: { chatId: '1', message: 'hi' },
    });

    expect(result).toEqual({ idMessage: '7' });
  });

  it('returns null for an empty body, which is how a poll timeout looks', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 200 })));

    const result = await request({
      credentials,
      method: 'GET',
      endpoint: 'receiveNotification',
    });

    expect(result).toBeNull();
  });

  it('throws GreenApiError carrying the status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('unauthorized', { status: 401 })),
    );

    await expect(
      request({ credentials, method: 'GET', endpoint: 'receiveNotification' }),
    ).rejects.toBeInstanceOf(GreenApiError);
  });

  it('puts the status on the thrown error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('nope', { status: 401 })),
    );

    await expect(
      request({ credentials, method: 'GET', endpoint: 'receiveNotification' }),
    ).rejects.toMatchObject({ status: 401, reason: 'nope' });
  });
});

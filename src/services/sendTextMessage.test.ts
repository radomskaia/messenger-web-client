import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GreenApiError } from '@/api/errors';
import * as methods from '@/api/methods';
import type { Credentials } from '@/domain/types';
import { useChatsStore } from '@/store/chatsStore';
import { useToastStore } from '@/store/toastStore';

import { sendTextMessage } from './sendTextMessage';

const credentials: Credentials = {
  idInstance: '1',
  apiTokenInstance: 't',
  apiUrl: 'https://api.green-api.com',
};

beforeEach(() => {
  vi.restoreAllMocks();
  useChatsStore.getState().reset();
  useToastStore.getState().reset();
});

describe('sendTextMessage', () => {
  it('stores the real message id returned by the API', async () => {
    vi.spyOn(methods, 'sendMessage').mockResolvedValue({ idMessage: 'REAL' });

    await sendTextMessage(credentials, '10', 'hi');

    expect(useChatsStore.getState().messages['10']?.[0]?.idMessage).toBe('REAL');
  });

  it('marks the message as sent on success', async () => {
    vi.spyOn(methods, 'sendMessage').mockResolvedValue({ idMessage: 'REAL' });

    await sendTextMessage(credentials, '10', 'hi');

    expect(useChatsStore.getState().messages['10']?.[0]?.status).toBe('sent');
  });

  it('removes the optimistic message on failure instead of leaving a ghost bubble', async () => {
    vi.spyOn(methods, 'sendMessage').mockRejectedValue(new Error('offline'));

    await sendTextMessage(credentials, '10', 'hi');

    expect(useChatsStore.getState().messages['10']).toHaveLength(0);
  });

  it('does not leave a failed message behind', async () => {
    vi.spyOn(methods, 'sendMessage').mockRejectedValue(new Error('offline'));

    await sendTextMessage(credentials, '10', 'hi');

    expect(
      useChatsStore.getState().messages['10']?.some((item) => item.status === 'failed'),
    ).toBe(false);
  });

  it('ignores the echoed notification for a message it already stored', async () => {
    vi.spyOn(methods, 'sendMessage').mockResolvedValue({ idMessage: 'REAL' });
    await sendTextMessage(credentials, '10', 'hi');

    useChatsStore.getState().addMessage({
      idMessage: 'REAL',
      chatId: '10',
      direction: 'outgoing',
      text: 'hi',
      timestamp: Date.now(),
      status: 'sent',
    });

    expect(useChatsStore.getState().messages['10']).toHaveLength(1);
  });

  it('reports success so the caller can keep the draft cleared', async () => {
    vi.spyOn(methods, 'sendMessage').mockResolvedValue({ idMessage: 'REAL' });

    await expect(sendTextMessage(credentials, '10', 'hi')).resolves.toBe(true);
  });

  it('reports failure so the caller can give the draft back', async () => {
    vi.spyOn(methods, 'sendMessage').mockRejectedValue(new Error('offline'));

    await expect(sendTextMessage(credentials, '10', 'hi')).resolves.toBe(false);
  });

  it('shows a generic toast when the send fails for another reason', async () => {
    vi.spyOn(methods, 'sendMessage').mockRejectedValue(new Error('offline'));

    await sendTextMessage(credentials, '10', 'hi');

    expect(useToastStore.getState().toasts[0]?.messageKey).toBe('toast.sendFailed');
  });

  it('shows a toast when the send is rate-limited', async () => {
    vi.spyOn(methods, 'sendMessage').mockRejectedValue(
      new GreenApiError(429, 'slow down'),
    );

    await sendTextMessage(credentials, '10', 'hi');

    expect(useToastStore.getState().toasts[0]?.messageKey).toBe('toast.tooManyRequests');
  });
});

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GreenApiError } from '@/api/errors';
import * as methods from '@/api/methods';
import type { ChatItem } from '@/api/types';
import { useAuthStore } from '@/store/authStore';
import { useChatsStore } from '@/store/chatsStore';
import { useConnectionStore } from '@/store/connectionStore';
import { useToastStore } from '@/store/toastStore';
import { deferred } from '@/test/deferred';

import { useNotificationLifecycle } from './useNotificationLifecycle';

const ivan: ChatItem = {
  chatId: '79001234567',
  name: 'Ivan',
  type: 'user',
  phoneNumber: 79_001_234_567,
  username: 'ivan',
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(methods, 'getChatList').mockResolvedValue([]);
  useChatsStore.getState().reset();
  useConnectionStore.setState({ status: 'idle' });
  useToastStore.getState().reset();
  useAuthStore.setState({
    credentials: {
      idInstance: '1',
      apiTokenInstance: 't',
      apiUrl: 'https://api.green-api.com',
    },
    isVerified: true,
    signOutReason: null,
  });
});

describe('useNotificationLifecycle', () => {
  it('signs the user out when GREEN-API rejects the token', async () => {
    vi.spyOn(methods, 'receiveNotification').mockRejectedValue(
      new GreenApiError(401, 'unauthorized'),
    );

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(useAuthStore.getState().credentials).toBeNull();
    });
    expect(useAuthStore.getState().signOutReason).toBe('auth.unauthorized');
  });

  it('keeps the user signed in for an ordinary network failure', async () => {
    vi.spyOn(methods, 'receiveNotification').mockRejectedValue(new Error('offline'));

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(useAuthStore.getState().credentials).not.toBeNull();
    });
  });

  it('loads history for the active chat', async () => {
    vi.spyOn(methods, 'receiveNotification').mockResolvedValue(null);
    const history = vi.spyOn(methods, 'getChatHistory').mockResolvedValue([]);
    useChatsStore.getState().setActiveChat('10');

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(history).toHaveBeenCalledWith(expect.anything(), '10');
    });
  });

  it('reports a failed history load instead of swallowing it', async () => {
    // The polling loop reports 'online' on every successful poll, including an
    // empty one — a real signal, not a bug (see notificationPolling.test.ts). A
    // resolved receiveNotification would race that continuous 'online' against
    // this test's single 'reconnecting', which is about the history effect in
    // isolation. Leaving it pending keeps the two signals from interfering.
    vi.spyOn(methods, 'receiveNotification').mockReturnValue(
      new Promise(() => {
        // Deliberately never resolves; see the comment above.
      }),
    );
    vi.spyOn(methods, 'getChatHistory').mockRejectedValue(new Error('offline'));
    useChatsStore.getState().setActiveChat('10');

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(useConnectionStore.getState().status).toBe('reconnecting');
    });
  });

  it('shows a toast, not the reconnecting banner, when a history load is rate-limited', async () => {
    vi.spyOn(methods, 'receiveNotification').mockReturnValue(
      new Promise(() => {
        // Never resolves; isolate the history effect from the poll loop.
      }),
    );
    vi.spyOn(methods, 'getChatHistory').mockRejectedValue(
      new GreenApiError(429, 'slow down'),
    );
    useChatsStore.getState().setActiveChat('10');

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
    expect(useToastStore.getState().toasts[0]?.messageKey).toBe('toast.tooManyRequests');
    expect(useConnectionStore.getState().status).not.toBe('reconnecting');
  });

  it('shows a toast, not the banner, when the chat list is rate-limited', async () => {
    vi.spyOn(methods, 'receiveNotification').mockReturnValue(
      new Promise(() => {
        // Never resolves; isolate loadChatList from the poll loop.
      }),
    );
    vi.spyOn(methods, 'getChatList').mockRejectedValue(
      new GreenApiError(429, 'slow down'),
    );

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
    expect(useConnectionStore.getState().status).not.toBe('reconnecting');
  });

  it('signs out with a reason when GREEN-API forbids the poll (403)', async () => {
    vi.spyOn(methods, 'receiveNotification').mockRejectedValue(
      new GreenApiError(403, 'Forbidden'),
    );

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(useAuthStore.getState().credentials).toBeNull();
    });
    expect(useAuthStore.getState().signOutReason).toBe('auth.unauthorized');
  });

  it('signs out with the expired reason when the instance subscription ended', async () => {
    vi.spyOn(methods, 'receiveNotification').mockRejectedValue(
      new GreenApiError(
        400,
        'Instance account is expired. Renew your instance from personal area',
      ),
    );

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(useAuthStore.getState().signOutReason).toBe('auth.expired');
    });
    expect(useConnectionStore.getState().status).not.toBe('reconnecting');
  });

  it('shows a toast when the poll loop is rate-limited', async () => {
    vi.spyOn(methods, 'receiveNotification').mockRejectedValue(
      new GreenApiError(429, 'slow down'),
    );

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  it('loads the chat list into the sidebar', async () => {
    vi.spyOn(methods, 'getChatList').mockResolvedValue([ivan]);
    vi.spyOn(methods, 'receiveNotification').mockResolvedValue(null);

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(useChatsStore.getState().chats['79001234567']?.name).toBe('Ivan');
    });
  });

  it('waits for the chat list before the first poll', async () => {
    // GREEN-API answers 429 when getChats and receiveNotification overlap.
    const chatList = deferred<ChatItem[]>();
    vi.spyOn(methods, 'getChatList').mockReturnValue(chatList.promise);
    const receive = vi.spyOn(methods, 'receiveNotification').mockResolvedValue(null);

    renderHook(() => {
      useNotificationLifecycle();
    });
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(receive).not.toHaveBeenCalled();

    chatList.resolve([ivan]);

    await waitFor(() => {
      expect(receive).toHaveBeenCalled();
    });
  });

  it('still polls when the chat list fails to load', async () => {
    vi.spyOn(methods, 'getChatList').mockRejectedValue(new Error('offline'));
    const receive = vi.spyOn(methods, 'receiveNotification').mockResolvedValue(null);

    renderHook(() => {
      useNotificationLifecycle();
    });

    await waitFor(() => {
      expect(receive).toHaveBeenCalled();
    });
  });

  it('never polls when the session ends while the chat list is loading', async () => {
    let signal: AbortSignal | undefined;
    vi.spyOn(methods, 'getChatList').mockImplementation((_credentials, options) => {
      signal = options?.signal;

      return deferred<ChatItem[]>().promise;
    });
    const receive = vi.spyOn(methods, 'receiveNotification').mockResolvedValue(null);

    const { unmount } = renderHook(() => {
      useNotificationLifecycle();
    });
    unmount();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });

    expect(signal?.aborted).toBe(true);
    expect(receive).not.toHaveBeenCalled();
  });
});

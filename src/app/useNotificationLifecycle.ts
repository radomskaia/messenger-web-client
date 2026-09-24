import { useEffect } from 'react';

import { GreenApiError } from '@/api/errors';
import { getChatList } from '@/api/methods';
import type { Chat, Credentials } from '@/domain/types';
import { startPolling } from '@/services/notificationPolling';
import { useAuthStore } from '@/store/authStore';
import { useChatsStore } from '@/store/chatsStore';
import { useConnectionStore } from '@/store/connectionStore';

const UNAUTHORIZED = 401;

async function loadChatList(
  credentials: Credentials,
  signal: AbortSignal,
): Promise<void> {
  try {
    const items = await getChatList(credentials, { signal });

    const chats: Chat[] = items.map((item) => ({
      chatId: item.chatId,
      ...(item.name && { name: item.name }),
      ...(item.username && { username: item.username }),
      ...(item.phoneNumber && { phoneNumber: item.phoneNumber }),
      lastMessageAt: 0,
    }));

    useChatsStore.getState().mergeChats(chats);
  } catch {
    if (signal.aborted) {
      return;
    }

    useConnectionStore.getState().setStatus('reconnecting');
  }
}

export function useNotificationLifecycle(): void {
  const credentials = useAuthStore((state) => state.credentials);
  const isVerified = useAuthStore((state) => state.isVerified);

  useEffect(() => {
    if (!credentials || !isVerified) {
      return;
    }

    const controller = new AbortController();
    let stop: (() => void) | undefined;

    const start = async () => {
      await loadChatList(credentials, controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      stop = startPolling(credentials, {
        onNotification: () => {
          /* empty */
        },
        onConnectionChange: useConnectionStore.getState().setStatus,
        onError: (error) => {
          if (error instanceof GreenApiError && error.status === UNAUTHORIZED) {
            useAuthStore.getState().signOut('auth.unauthorized');
          }
        },
      });
    };

    void start();

    return () => {
      controller.abort();
      stop?.();
      useConnectionStore.getState().setStatus('idle');
    };
  }, [credentials, isVerified]);
}

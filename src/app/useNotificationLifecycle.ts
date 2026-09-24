import { useEffect } from 'react';

import { GreenApiError } from '@/api/errors';
import { getChatHistory, getChatList } from '@/api/methods';
import { historyItemToMessage } from '@/domain/mappers';
import type { Chat, Credentials, Message } from '@/domain/types';
import { startPolling } from '@/services/notificationPolling';
import { useAuthStore } from '@/store/authStore';
import { useChatsStore } from '@/store/chatsStore';
import { useConnectionStore } from '@/store/connectionStore';

import { handleNotification } from './handleNotification';

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
  const activeChatId = useChatsStore((state) => state.activeChatId);

  useEffect(() => {
    if (!credentials || !isVerified) {
      return;
    }

    const controller = new AbortController();
    let stop: (() => void) | undefined;

    const start = async () => {
      // GREEN-API answers 429 when getChats and the first receiveNotification
      // overlap, so the chat list goes first and polling waits for it.
      await loadChatList(credentials, controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      stop = startPolling(credentials, {
        onNotification: handleNotification,
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

  useEffect(() => {
    if (!credentials || !activeChatId) {
      return;
    }

    const load = async () => {
      const history = await getChatHistory(credentials, activeChatId);
      const messages = history
        .map((item) => historyItemToMessage(item))
        .filter((message): message is Message => message !== null);

      useChatsStore.getState().addMessages(messages);
    };

    void load().catch(() => {
      useConnectionStore.getState().setStatus('reconnecting');
    });
  }, [credentials, activeChatId]);
}

import { useEffect } from 'react';

import { classifyApiFailure } from '@/api/errors';
import { getChatHistory, getChatList } from '@/api/methods';
import { historyItemToMessage } from '@/domain/mappers';
import type { Chat, Credentials, Message } from '@/domain/types';
import { startPolling } from '@/services/notificationPolling';
import { useAuthStore } from '@/store/authStore';
import { useChatsStore } from '@/store/chatsStore';
import { useConnectionStore } from '@/store/connectionStore';
import { useToastStore } from '@/store/toastStore';

import { handleNotification } from './handleNotification';

const SIGN_OUT_REASON = {
  rejected: 'auth.unauthorized',
  expired: 'auth.expired',
  deleted: 'auth.deleted',
  notAuthorized: 'auth.notAuthorized',
} as const;

function handleFailure(error: unknown): void {
  const failure = classifyApiFailure(error);

  if (failure === 'rateLimited') {
    useToastStore.getState().push('toast.tooManyRequests');

    return;
  }

  if (failure === 'transient') {
    useConnectionStore.getState().setStatus('reconnecting');

    return;
  }

  useAuthStore.getState().signOut(SIGN_OUT_REASON[failure]);
}

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
  } catch (error) {
    if (signal.aborted) {
      return;
    }

    handleFailure(error);
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
        onError: handleFailure,
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

    void load().catch((error: unknown) => {
      handleFailure(error);
    });
  }, [credentials, activeChatId]);
}

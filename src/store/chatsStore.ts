import { create } from 'zustand';

import type { Chat, Message } from '@/domain/types';

export const MESSAGES_PER_CHAT_LIMIT = 200;

interface ChatsState {
  chats: Record<string, Chat>;
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  unread: Record<string, number>;
  unreadDivider: { chatId: string; beforeId: string } | null;
  mergeChats: (chats: readonly Chat[]) => void;
  setActiveChat: (chatId: string | null) => void;
  addMessage: (message: Message) => void;
  addMessages: (messages: readonly Message[]) => void;
  replaceMessageId: (chatId: string, temporaryId: string, message: Message) => void;
  removeMessage: (chatId: string, idMessage: string) => void;
  incrementUnread: (chatId: string) => void;
  markChatRead: (chatId: string) => void;
  dismissUnreadDivider: () => void;
  reset: () => void;
}

function withMessage(existing: readonly Message[], message: Message): Message[] {
  return existing.some((item) => item.idMessage === message.idMessage)
    ? [...existing]
    : [...existing, message]
        .toSorted((left, right) => left.timestamp - right.timestamp)
        .slice(-MESSAGES_PER_CHAT_LIMIT);
}

export const useChatsStore = create<ChatsState>()((set) => ({
  chats: {},
  messages: {},
  activeChatId: null,
  unread: {},
  unreadDivider: null,

  mergeChats: (incoming) => {
    set((state) => {
      const chats = { ...state.chats };

      for (const [index, chat] of incoming.entries()) {
        const existing = chats[chat.chatId];

        if (existing) {
          chats[chat.chatId] = {
            ...existing,
            ...(!existing.name && chat.name && { name: chat.name }),
            ...(!existing.username && chat.username && { username: chat.username }),
            ...(!existing.phoneNumber &&
              chat.phoneNumber && { phoneNumber: chat.phoneNumber }),
          };

          continue;
        }

        chats[chat.chatId] = {
          ...chat,
          lastMessageAt: chat.lastMessageAt || (index === 0 ? 0 : -index),
        };
      }

      return { chats };
    });
  },

  setActiveChat: (chatId) => {
    set((state) => {
      if (!chatId) {
        return { activeChatId: null, unreadDivider: null };
      }

      const count = state.unread[chatId] ?? 0;
      let firstUnread: Message | undefined;

      if (count > 0) {
        firstUnread = state.messages[chatId]?.at(-count);
      }

      return {
        activeChatId: chatId,
        unreadDivider: firstUnread ? { chatId, beforeId: firstUnread.idMessage } : null,
      };
    });
  },

  incrementUnread: (chatId) => {
    set((state) => ({
      unread: { ...state.unread, [chatId]: (state.unread[chatId] ?? 0) + 1 },
    }));
  },

  markChatRead: (chatId) => {
    set((state) => {
      if (!Object.hasOwn(state.unread, chatId)) {
        return {};
      }

      const { [chatId]: _read, ...unread } = state.unread;

      return { unread };
    });
  },

  dismissUnreadDivider: () => {
    set({ unreadDivider: null });
  },

  addMessage: (message) => {
    set((state) => {
      const existing = state.chats[message.chatId];

      return {
        chats: existing
          ? {
              ...state.chats,
              [message.chatId]: {
                ...existing,
                lastMessageAt: Math.max(existing.lastMessageAt, message.timestamp),
              },
            }
          : state.chats,
        messages: {
          ...state.messages,
          [message.chatId]: withMessage(state.messages[message.chatId] ?? [], message),
        },
      };
    });
  },

  addMessages: (incoming) => {
    set((state) => {
      const next = { ...state.messages };

      for (const message of incoming) {
        next[message.chatId] = withMessage(next[message.chatId] ?? [], message);
      }

      return { messages: next };
    });
  },

  replaceMessageId: (chatId, temporaryId, message) => {
    set((state) => {
      const withoutTemporary = (state.messages[chatId] ?? []).filter(
        (item) => item.idMessage !== temporaryId,
      );

      return {
        messages: {
          ...state.messages,
          [chatId]: withMessage(withoutTemporary, message),
        },
      };
    });
  },

  removeMessage: (chatId, idMessage) => {
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] ?? []).filter(
          (item) => item.idMessage !== idMessage,
        ),
      },
    }));
  },

  reset: () => {
    set({ chats: {}, messages: {}, activeChatId: null, unread: {}, unreadDivider: null });
  },
}));

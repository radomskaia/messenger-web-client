import { beforeEach, describe, expect, it } from 'vitest';

import type { Message } from '@/domain/types';

import { MESSAGES_PER_CHAT_LIMIT, useChatsStore } from './chatsStore';

function message(overrides: Partial<Message> = {}): Message {
  return {
    idMessage: 'ABC',
    chatId: '10',
    direction: 'incoming',
    text: 'hello',
    timestamp: 1000,
    status: 'sent',
    ...overrides,
  };
}

beforeEach(() => {
  useChatsStore.getState().reset();
  localStorage.clear();
});

describe('chatsStore.addMessage', () => {
  it('adds a message to its chat', () => {
    useChatsStore.getState().addMessage(message());

    expect(useChatsStore.getState().messages['10']).toHaveLength(1);
  });

  it('ignores a message whose idMessage is already present', () => {
    useChatsStore.getState().addMessage(message());
    useChatsStore.getState().addMessage(message({ text: 'echo from the queue' }));

    expect(useChatsStore.getState().messages['10']).toHaveLength(1);
  });

  it('keeps the first copy when a duplicate arrives', () => {
    useChatsStore.getState().addMessage(message({ text: 'original' }));
    useChatsStore.getState().addMessage(message({ text: 'echo' }));

    expect(useChatsStore.getState().messages['10']?.[0]?.text).toBe('original');
  });

  it('orders messages by timestamp regardless of arrival order', () => {
    useChatsStore.getState().addMessage(message({ idMessage: 'B', timestamp: 2000 }));
    useChatsStore.getState().addMessage(message({ idMessage: 'A', timestamp: 1000 }));

    expect(
      useChatsStore.getState().messages['10']?.map((item) => item.idMessage),
    ).toEqual(['A', 'B']);
  });

  it('caps the stored history per chat', () => {
    for (let index = 0; index <= MESSAGES_PER_CHAT_LIMIT; index += 1) {
      useChatsStore
        .getState()
        .addMessage(message({ idMessage: `id-${index}`, timestamp: index }));
    }

    expect(useChatsStore.getState().messages['10']).toHaveLength(MESSAGES_PER_CHAT_LIMIT);
  });

  it('drops the oldest message when the cap is exceeded', () => {
    for (let index = 0; index <= MESSAGES_PER_CHAT_LIMIT; index += 1) {
      useChatsStore
        .getState()
        .addMessage(message({ idMessage: `id-${index}`, timestamp: index }));
    }

    expect(useChatsStore.getState().messages['10']?.[0]?.idMessage).toBe('id-1');
  });
});

describe('chatsStore.replaceMessageId', () => {
  it('swaps a temporary id for the real one returned by the API', () => {
    useChatsStore
      .getState()
      .addMessage(message({ idMessage: 'temp-1', status: 'pending' }));
    useChatsStore
      .getState()
      .replaceMessageId('10', 'temp-1', message({ idMessage: 'REAL', status: 'sent' }));

    expect(useChatsStore.getState().messages['10']?.[0]?.idMessage).toBe('REAL');
  });

  it('makes the echoed notification a no-op after the swap', () => {
    useChatsStore
      .getState()
      .addMessage(message({ idMessage: 'temp-1', status: 'pending' }));
    useChatsStore
      .getState()
      .replaceMessageId('10', 'temp-1', message({ idMessage: 'REAL', status: 'sent' }));
    useChatsStore.getState().addMessage(message({ idMessage: 'REAL' }));

    expect(useChatsStore.getState().messages['10']).toHaveLength(1);
  });

  it('does not duplicate when the real id already arrived from the queue', () => {
    useChatsStore
      .getState()
      .addMessage(message({ idMessage: 'temp-1', status: 'pending' }));
    useChatsStore.getState().addMessage(message({ idMessage: 'REAL' }));
    useChatsStore
      .getState()
      .replaceMessageId('10', 'temp-1', message({ idMessage: 'REAL' }));

    expect(useChatsStore.getState().messages['10']).toHaveLength(1);
  });
});

describe('chatsStore.removeMessage', () => {
  it('removes a message from its chat', () => {
    useChatsStore
      .getState()
      .addMessage(message({ idMessage: 'temp-1', status: 'pending' }));
    useChatsStore.getState().removeMessage('10', 'temp-1');

    expect(useChatsStore.getState().messages['10']).toHaveLength(0);
  });

  it('leaves other messages in the chat untouched', () => {
    useChatsStore.getState().addMessage(message({ idMessage: 'A', timestamp: 1 }));
    useChatsStore.getState().addMessage(message({ idMessage: 'B', timestamp: 2 }));
    useChatsStore.getState().removeMessage('10', 'A');

    expect(
      useChatsStore.getState().messages['10']?.map((item) => item.idMessage),
    ).toEqual(['B']);
  });
});

describe('chatsStore.addMessages', () => {
  it('adds several messages at once', () => {
    useChatsStore
      .getState()
      .addMessages([
        message({ idMessage: 'A', timestamp: 1 }),
        message({ idMessage: 'B', timestamp: 2 }),
      ]);

    expect(useChatsStore.getState().messages['10']).toHaveLength(2);
  });

  it('deduplicates within the batch and against what is already stored', () => {
    useChatsStore.getState().addMessage(message({ idMessage: 'A', timestamp: 1 }));
    useChatsStore
      .getState()
      .addMessages([
        message({ idMessage: 'A', timestamp: 1 }),
        message({ idMessage: 'B', timestamp: 2 }),
      ]);

    expect(useChatsStore.getState().messages['10']).toHaveLength(2);
  });
});

describe('chatsStore.mergeChats', () => {
  it('adds chats it did not know about', () => {
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 0 }]);

    expect(useChatsStore.getState().chats['10']).toEqual({
      chatId: '10',
      name: 'Ivan',
      lastMessageAt: 0,
    });
  });

  it('keeps the activity time and name of a chat it already has', () => {
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Vanya', lastMessageAt: 500 }]);

    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 0 }]);

    expect(useChatsStore.getState().chats['10']).toMatchObject({
      name: 'Vanya',
      lastMessageAt: 500,
    });
  });

  it('fills a missing name from the list without touching the phone number', () => {
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', phoneNumber: 79_001_234_567, lastMessageAt: 500 }]);

    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 0 }]);

    expect(useChatsStore.getState().chats['10']).toEqual({
      chatId: '10',
      name: 'Ivan',
      phoneNumber: 79_001_234_567,
      lastMessageAt: 500,
    });
  });

  it('keeps chats the list does not mention, such as one just started here', () => {
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '20', name: 'Olga', lastMessageAt: 700 }]);

    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 0 }]);

    expect(useChatsStore.getState().chats).toHaveProperty('10');
    expect(useChatsStore.getState().chats).toHaveProperty('20');
  });
});

describe('chatsStore ordering', () => {
  it('keeps the server order, first chat on top, even with numeric ids', () => {
    // Object iteration puts numeric-like keys in ascending order, so without an
    // explicit sort key the list would show 10, 20, 30 whatever the server sent.
    useChatsStore.getState().mergeChats([
      { chatId: '30', name: 'C', lastMessageAt: 0 },
      { chatId: '10', name: 'A', lastMessageAt: 0 },
      { chatId: '20', name: 'B', lastMessageAt: 0 },
    ]);

    const { chats } = useChatsStore.getState();
    const order = ['30', '10', '20'].map((id) => chats[id]?.lastMessageAt ?? 0);

    expect(order[0]).toBeGreaterThan(order[1] ?? 0);
    expect(order[1]).toBeGreaterThan(order[2] ?? 0);
  });

  it('raises a chat above the list once it has a message', () => {
    useChatsStore.getState().mergeChats([
      { chatId: '30', name: 'C', lastMessageAt: 0 },
      { chatId: '10', name: 'A', lastMessageAt: 0 },
    ]);

    useChatsStore.getState().addMessage(message({ chatId: '10', timestamp: 1000 }));

    const { chats } = useChatsStore.getState();
    expect(chats['10']?.lastMessageAt).toBe(1000);
    expect(chats['10']?.lastMessageAt).toBeGreaterThan(chats['30']?.lastMessageAt ?? 0);
  });

  it('does not reorder a chat when its history loads', () => {
    useChatsStore.getState().mergeChats([{ chatId: '10', name: 'A', lastMessageAt: 0 }]);
    const before = useChatsStore.getState().chats['10']?.lastMessageAt;

    useChatsStore.getState().addMessages([message({ chatId: '10', timestamp: 5000 })]);

    expect(useChatsStore.getState().chats['10']?.lastMessageAt).toBe(before);
  });
});

describe('chatsStore storage', () => {
  it('keeps chats and messages out of localStorage', () => {
    useChatsStore
      .getState()
      .mergeChats([{ chatId: '10', name: 'Ivan', lastMessageAt: 1000 }]);
    useChatsStore.getState().addMessage(message());

    expect(localStorage.getItem('messenger:chats')).toBeNull();
  });
});

describe('chatsStore.unread', () => {
  it('counts unread per chat', () => {
    useChatsStore.getState().incrementUnread('10');
    useChatsStore.getState().incrementUnread('10');
    useChatsStore.getState().incrementUnread('20');

    expect(useChatsStore.getState().unread['10']).toBe(2);
    expect(useChatsStore.getState().unread['20']).toBe(1);
  });

  it('clears a chat unread count when it is marked read', () => {
    useChatsStore.getState().incrementUnread('10');
    useChatsStore.getState().markChatRead('10');

    expect(useChatsStore.getState().unread['10']).toBeUndefined();
  });

  it('drops a divider before the first unread message when the chat opens', () => {
    useChatsStore
      .getState()
      .addMessages([
        message({ idMessage: 'a', chatId: '10', timestamp: 1 }),
        message({ idMessage: 'b', chatId: '10', timestamp: 2 }),
        message({ idMessage: 'c', chatId: '10', timestamp: 3 }),
      ]);
    useChatsStore.getState().incrementUnread('10');
    useChatsStore.getState().incrementUnread('10');

    useChatsStore.getState().setActiveChat('10');

    expect(useChatsStore.getState().unreadDivider).toEqual({
      chatId: '10',
      beforeId: 'b',
    });
  });

  it('leaves no divider when the opened chat has nothing unread', () => {
    useChatsStore.getState().addMessage(message({ chatId: '10' }));

    useChatsStore.getState().setActiveChat('10');

    expect(useChatsStore.getState().unreadDivider).toBeNull();
  });

  it('does not clear the unread count merely by opening the chat', () => {
    useChatsStore.getState().addMessage(message({ chatId: '10' }));
    useChatsStore.getState().incrementUnread('10');

    useChatsStore.getState().setActiveChat('10');

    expect(useChatsStore.getState().unread['10']).toBe(1);
  });

  it('dismisses the divider on demand', () => {
    useChatsStore.getState().addMessage(message({ idMessage: 'a', chatId: '10' }));
    useChatsStore.getState().incrementUnread('10');
    useChatsStore.getState().setActiveChat('10');

    useChatsStore.getState().dismissUnreadDivider();

    expect(useChatsStore.getState().unreadDivider).toBeNull();
  });

  it('clears the divider when leaving the chat', () => {
    useChatsStore.getState().addMessage(message({ idMessage: 'a', chatId: '10' }));
    useChatsStore.getState().incrementUnread('10');
    useChatsStore.getState().setActiveChat('10');

    useChatsStore.getState().setActiveChat(null);

    expect(useChatsStore.getState().unreadDivider).toBeNull();
  });
});

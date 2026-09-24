import { beforeEach, describe, expect, it } from 'vitest';

import { useChatsStore } from '@/store/chatsStore';

import { handleNotification } from './handleNotification';

const notification = {
  typeWebhook: 'incomingMessageReceived',
  idMessage: 'ABC',
  timestamp: 1_763_115_112,
  senderData: { chatId: '10000000', senderName: 'Ivan', chatName: 'Ivan' },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'hello' },
  },
};

beforeEach(() => {
  useChatsStore.getState().reset();
});

describe('handleNotification', () => {
  it('stores an incoming text message', () => {
    handleNotification(notification);

    expect(useChatsStore.getState().messages['10000000']).toHaveLength(1);
  });

  it('creates the chat when the message arrives from an unknown sender', () => {
    handleNotification(notification);

    expect(useChatsStore.getState().chats['10000000']?.name).toBe('Ivan');
  });

  it('does not overwrite a name it already has', () => {
    useChatsStore.getState().mergeChats([
      {
        chatId: '10000000',
        name: 'Vanya',
        lastMessageAt: 1_763_115_100,
      },
    ]);

    handleNotification(notification);

    expect(useChatsStore.getState().chats['10000000']?.name).toBe('Vanya');
  });

  it('ignores a webhook that is not a text message', () => {
    handleNotification({ typeWebhook: 'outgoingMessageStatus' });

    expect(Object.keys(useChatsStore.getState().messages)).toHaveLength(0);
  });

  it('ignores a duplicate redelivery', () => {
    handleNotification(notification);
    handleNotification(notification);

    expect(useChatsStore.getState().messages['10000000']).toHaveLength(1);
  });

  it('does not take a name from an outgoing echo, which carries the owner', () => {
    useChatsStore.getState().mergeChats([
      {
        chatId: '10000000',
        phoneNumber: 10_000_000,
        lastMessageAt: 1_763_115_100,
      },
    ]);

    const outgoingEcho = {
      typeWebhook: 'outgoingMessageReceived',
      idMessage: 'DEF',
      timestamp: 1_763_115_200,
      senderData: {
        chatId: '10000000',
        senderName: 'Me (instance owner)',
        chatName: 'Ivan',
      },
      messageData: {
        typeMessage: 'textMessage',
        textMessageData: { textMessage: 'hi there' },
      },
    };

    handleNotification(outgoingEcho);

    // The owner's name must not become the chat's name; it stays nameless.
    expect(useChatsStore.getState().chats['10000000']?.name).toBeUndefined();
  });
});

describe('handleNotification unread', () => {
  it('raises the unread count for an incoming message to a chat that is not open', () => {
    handleNotification(notification);

    expect(useChatsStore.getState().unread['10000000']).toBe(1);
  });

  it('does not count an incoming message for the chat that is open', () => {
    useChatsStore.getState().setActiveChat('10000000');

    handleNotification(notification);

    expect(useChatsStore.getState().unread['10000000']).toBeUndefined();
  });

  it('does not count an outgoing echo', () => {
    handleNotification({ ...notification, typeWebhook: 'outgoingMessageReceived' });

    expect(useChatsStore.getState().unread['10000000']).toBeUndefined();
  });
});

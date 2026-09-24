import { describe, expect, it } from 'vitest';

import type { ChatHistoryItem, TextMessageNotification } from '@/api/types';

import { chatTitle, historyItemToMessage, notificationToMessage } from './mappers';

const notification: TextMessageNotification = {
  typeWebhook: 'incomingMessageReceived',
  idMessage: 'ABC',
  timestamp: 1_763_115_112,
  senderData: { chatId: '10000000', senderName: 'Ivan', chatName: 'Ivan' },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'hello' },
  },
};

describe('notificationToMessage', () => {
  it('converts an incoming notification', () => {
    expect(notificationToMessage(notification)).toEqual({
      idMessage: 'ABC',
      chatId: '10000000',
      direction: 'incoming',
      text: 'hello',
      timestamp: 1_763_115_112_000,
      status: 'sent',
    });
  });

  it('marks an outgoing webhook as outgoing', () => {
    const outgoing = { ...notification, typeWebhook: 'outgoingMessageReceived' } as const;

    expect(notificationToMessage(outgoing).direction).toBe('outgoing');
  });

  it('converts the timestamp from seconds to milliseconds', () => {
    expect(notificationToMessage(notification).timestamp).toBe(1_763_115_112_000);
  });
});

describe('historyItemToMessage', () => {
  it('converts a text history item into the same shape as a notification', () => {
    const item: ChatHistoryItem = {
      type: 'incoming',
      idMessage: 'ABC',
      timestamp: 1_763_115_112,
      chatId: '10000000',
      chatType: 'user',
      senderName: 'Ivan',
      senderType: 'user',
      typeMessage: 'textMessage',
      textMessage: 'hello',
    };

    expect(historyItemToMessage(item)).toEqual(notificationToMessage(notification));
  });

  it('ignores a non-text history item', () => {
    const item: ChatHistoryItem = {
      type: 'incoming',
      idMessage: 'IMG',
      timestamp: 1,
      chatId: '10000000',
      chatType: 'user',
      senderName: 'Ivan',
      senderType: 'user',
      typeMessage: 'imageMessage',
      downloadUrl: 'https://example.test/photo.jpg',
    };

    expect(historyItemToMessage(item)).toBeNull();
  });
});

describe('chatTitle', () => {
  it('prefers the contact name', () => {
    expect(
      chatTitle({
        chatId: '1',
        name: 'Ivan',
        phoneNumber: 79_001_234_567,
        lastMessageAt: 0,
      }),
    ).toBe('Ivan');
  });

  it('falls back to the phone number, with a plus', () => {
    expect(
      chatTitle({
        chatId: '1',
        phoneNumber: 79_001_234_567,
        username: 'ivan',
        lastMessageAt: 0,
      }),
    ).toBe('+79001234567');
  });

  it('falls back to the username when there is no name or number', () => {
    expect(chatTitle({ chatId: '1', username: 'ivan', lastMessageAt: 0 })).toBe('ivan');
  });

  it('falls back to the chat id so the title is never empty', () => {
    expect(chatTitle({ chatId: '79001234567', lastMessageAt: 0 })).toBe('79001234567');
  });
});

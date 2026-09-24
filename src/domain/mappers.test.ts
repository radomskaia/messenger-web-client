import { describe, expect, it } from 'vitest';

import { chatTitle } from './mappers';

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

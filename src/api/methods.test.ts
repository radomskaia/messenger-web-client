import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Credentials } from '@/domain/types';

import * as client from './client';
import {
  checkAccount,
  deleteNotification,
  getChatHistory,
  getChatList,
  receiveNotification,
  sendMessage,
} from './methods';

const credentials: Credentials = {
  idInstance: '1',
  apiTokenInstance: 't',
  apiUrl: 'https://api.green-api.com',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('methods', () => {
  it('sends a message as a POST with chatId and message', async () => {
    const spy = vi.spyOn(client, 'request').mockResolvedValue({ idMessage: '9' });

    await sendMessage(credentials, { chatId: '10', message: 'hi' });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        endpoint: 'sendMessage',
        body: { chatId: '10', message: 'hi' },
      }),
    );
  });

  it('polls with the requested receive timeout', async () => {
    const spy = vi.spyOn(client, 'request').mockResolvedValue(null);

    await receiveNotification(credentials, { receiveTimeoutSeconds: 20 });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        endpoint: 'receiveNotification',
        search: { receiveTimeout: '20' },
      }),
    );
  });

  it('acknowledges a notification by receipt id in the path', async () => {
    const spy = vi
      .spyOn(client, 'request')
      .mockResolvedValue({ result: true, reason: '' });

    await deleteNotification(credentials, 42);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        endpoint: 'deleteNotification',
        extraSegments: ['42'],
      }),
    );
  });

  it('checks an account by numeric phone number', async () => {
    const spy = vi
      .spyOn(client, 'request')
      .mockResolvedValue({ exist: true, chatId: '10000000' });

    const result = await checkAccount(credentials, '79001234567');

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ body: { phoneNumber: 79_001_234_567 } }),
    );
    expect(result.chatId).toBe('10000000');
  });

  it('returns an empty history array when the API returns nothing', async () => {
    vi.spyOn(client, 'request').mockResolvedValue(null);

    await expect(getChatHistory(credentials, '10')).resolves.toEqual([]);
  });

  it('returns the id of the sent message', async () => {
    vi.spyOn(client, 'request').mockResolvedValue({ idMessage: '9' });

    await expect(
      sendMessage(credentials, { chatId: '10', message: 'hi' }),
    ).resolves.toEqual({ idMessage: '9' });
  });

  it('resolves to null when a poll times out, which is not an error', async () => {
    vi.spyOn(client, 'request').mockResolvedValue(null);

    await expect(
      receiveNotification(credentials, { receiveTimeoutSeconds: 5 }),
    ).resolves.toBeNull();
  });

  it('throws when sendMessage gets an empty body, which that endpoint never returns', async () => {
    vi.spyOn(client, 'request').mockResolvedValue(null);

    await expect(
      sendMessage(credentials, { chatId: '10', message: 'hi' }),
    ).rejects.toThrow();
  });

  it('throws when checkAccount gets an empty body', async () => {
    vi.spyOn(client, 'request').mockResolvedValue(null);

    await expect(checkAccount(credentials, '79001234567')).rejects.toThrow();
  });

  it('rejects a formatted phone number instead of shipping it as null', async () => {
    const spy = vi
      .spyOn(client, 'request')
      .mockResolvedValue({ exist: true, chatId: '1' });

    await expect(checkAccount(credentials, '+7 900 123-45-67')).rejects.toThrow(
      'digits only',
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('fetches the chat list as a GET from the getChats endpoint', async () => {
    const spy = vi.spyOn(client, 'request').mockResolvedValue([]);

    await getChatList(credentials);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', endpoint: 'getChats' }),
    );
  });

  it('returns the chats the API sent', async () => {
    const chats = [
      {
        chatId: '10000000',
        name: 'Ivan',
        type: 'user',
        phoneNumber: 79_001_234_567,
        username: 'ivan',
      },
    ];

    vi.spyOn(client, 'request').mockResolvedValue(chats);

    await expect(getChatList(credentials)).resolves.toEqual(chats);
  });

  it('returns an empty chat list when the API returns nothing', async () => {
    vi.spyOn(client, 'request').mockResolvedValue(null);

    await expect(getChatList(credentials)).resolves.toEqual([]);
  });

  it('rejects a sendMessage body of an unexpected shape', async () => {
    vi.spyOn(client, 'request').mockResolvedValue({ idMessage: 7 });

    await expect(
      sendMessage(credentials, { chatId: '10', message: 'hi' }),
    ).rejects.toThrow('unexpected shape');
  });

  it('rejects a checkAccount body of an unexpected shape', async () => {
    vi.spyOn(client, 'request').mockResolvedValue({ exist: true, chatId: 10 });

    await expect(checkAccount(credentials, '79001234567')).rejects.toThrow(
      'unexpected shape',
    );
  });

  it('drops a malformed history entry and keeps the sound ones', async () => {
    const sound = {
      type: 'incoming',
      idMessage: 'ABC',
      timestamp: 1_763_115_112,
      chatId: '10',
      chatType: 'user',
      typeMessage: 'textMessage',
      senderName: 'Ivan',
      senderType: 'user',
      textMessage: 'hello',
    };

    vi.spyOn(client, 'request').mockResolvedValue([
      sound,
      { ...sound, idMessage: 'BAD', timestamp: 'not a number' },
    ]);

    await expect(getChatHistory(credentials, '10')).resolves.toEqual([sound]);
  });

  it('drops a malformed chat list entry and keeps the sound ones', async () => {
    const sound = {
      chatId: '10000000',
      name: 'Ivan',
      type: 'user',
      phoneNumber: 79_001_234_567,
      username: '@ivan',
    };

    vi.spyOn(client, 'request').mockResolvedValue([
      sound,
      { ...sound, chatId: '20000000', phoneNumber: 'hidden' },
    ]);

    await expect(getChatList(credentials)).resolves.toEqual([sound]);
  });
});

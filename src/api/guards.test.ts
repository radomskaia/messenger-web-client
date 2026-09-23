import { describe, expect, it } from 'vitest';

import {
  isChatHistoryItem,
  isChatItem,
  isCheckAccountResponse,
  isInstanceSettings,
  isSetSettingsResponse,
  isSendMessageResponse,
  isTextMessageNotification,
} from './guards';

const incoming = {
  typeWebhook: 'incomingMessageReceived',
  idMessage: 'ABC',
  timestamp: 1_763_115_112,
  senderData: { chatId: '10000000', senderName: 'Ivan', chatName: 'Ivan' },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'hello' },
  },
};

describe('isTextMessageNotification', () => {
  it('accepts an incoming text message', () => {
    expect(isTextMessageNotification(incoming)).toBe(true);
  });

  it('accepts an outgoing text message, which is how our own sends come back', () => {
    expect(
      isTextMessageNotification({ ...incoming, typeWebhook: 'outgoingMessageReceived' }),
    ).toBe(true);
  });

  it('rejects a non-text message', () => {
    expect(
      isTextMessageNotification({
        ...incoming,
        messageData: { typeMessage: 'imageMessage' },
      }),
    ).toBe(false);
  });

  it('rejects a status webhook', () => {
    expect(isTextMessageNotification({ typeWebhook: 'outgoingMessageStatus' })).toBe(
      false,
    );
  });

  it('rejects a non-object', () => {
    expect(isTextMessageNotification('nonsense')).toBe(false);
  });

  it('rejects null', () => {
    expect(isTextMessageNotification(null)).toBe(false);
  });

  it('rejects an array', () => {
    expect(isTextMessageNotification([])).toBe(false);
  });

  it('rejects a numeric idMessage, which would break deduplication silently', () => {
    expect(isTextMessageNotification({ ...incoming, idMessage: 123 })).toBe(false);
  });

  it('rejects a falsy but wrongly typed senderName', () => {
    expect(
      isTextMessageNotification({
        ...incoming,
        senderData: { chatId: '10000000', senderName: 0 },
      }),
    ).toBe(false);
  });

  it('rejects a missing timestamp, which would render as an invalid date', () => {
    const { timestamp: _timestamp, ...withoutTimestamp } = incoming;

    expect(isTextMessageNotification(withoutTimestamp)).toBe(false);
  });

  it('rejects a missing senderData', () => {
    const { senderData: _senderData, ...withoutSender } = incoming;

    expect(isTextMessageNotification(withoutSender)).toBe(false);
  });

  it('rejects a non-string chatId', () => {
    expect(isTextMessageNotification({ ...incoming, senderData: { chatId: 10 } })).toBe(
      false,
    );
  });

  it('rejects a numeric textMessage', () => {
    expect(
      isTextMessageNotification({
        ...incoming,
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 7 } },
      }),
    ).toBe(false);
  });
});

describe('isSendMessageResponse', () => {
  it('accepts a response carrying a message id', () => {
    expect(isSendMessageResponse({ idMessage: 'REAL' })).toBe(true);
  });

  it('rejects a numeric id, which would break deduplication silently', () => {
    expect(isSendMessageResponse({ idMessage: 7 })).toBe(false);
  });

  it('rejects a non-object', () => {
    expect(isSendMessageResponse('nonsense')).toBe(false);
  });
});

describe('isCheckAccountResponse', () => {
  it('accepts an existing account', () => {
    expect(
      isCheckAccountResponse({ exist: true, chatId: '10000000', username: 'ivan' }),
    ).toBe(true);
  });

  it('accepts the shape returned when no account exists', () => {
    expect(isCheckAccountResponse({ exist: false, chatId: '' })).toBe(true);
  });

  it('rejects a numeric chatId, which would become a store key', () => {
    expect(isCheckAccountResponse({ exist: true, chatId: 10_000_000 })).toBe(false);
  });

  it('rejects a non-boolean exist flag', () => {
    expect(isCheckAccountResponse({ exist: 'yes', chatId: '10000000' })).toBe(false);
  });

  it('rejects a present but wrongly typed optional field', () => {
    expect(isCheckAccountResponse({ exist: true, chatId: '10000000', username: 7 })).toBe(
      false,
    );
  });
});

describe('isChatHistoryItem', () => {
  // The response example from the GetChatHistory reference, verbatim.
  const outgoing = {
    type: 'outgoing',
    idMessage: '1769676078000',
    timestamp: 1_769_676_078,
    typeMessage: 'textMessage',
    chatId: '10000000',
    chatType: 'user',
    textMessage: 'I am using GREEN-API to send this message!',
    statusMessage: 'delivered',
    sendByApi: true,
  };

  const incomingItem = {
    type: 'incoming',
    idMessage: 'ABC',
    timestamp: 1_763_115_112,
    typeMessage: 'textMessage',
    chatId: '10000000',
    chatType: 'user',
    senderName: 'Ivan',
    senderType: 'user',
    textMessage: 'hello',
  };

  it('accepts the documented response example', () => {
    expect(isChatHistoryItem(outgoing)).toBe(true);
  });

  it('accepts an incoming text item', () => {
    expect(isChatHistoryItem(incomingItem)).toBe(true);
  });

  it('accepts an item with no isForwarded, which the example itself omits', () => {
    expect(isChatHistoryItem({ ...outgoing, isForwarded: undefined })).toBe(true);
  });

  it('accepts a media item carrying a download url', () => {
    expect(
      isChatHistoryItem({
        ...incomingItem,
        typeMessage: 'imageMessage',
        textMessage: undefined,
        downloadUrl: 'https://example.test/photo.jpg',
      }),
    ).toBe(true);
  });

  it('accepts a bot chat, which the reference lists as a chat type', () => {
    expect(
      isChatHistoryItem({ ...incomingItem, chatType: 'bot', senderType: 'bot' }),
    ).toBe(true);
  });

  it('rejects a media item with no download url', () => {
    expect(
      isChatHistoryItem({
        ...incomingItem,
        typeMessage: 'imageMessage',
        textMessage: undefined,
      }),
    ).toBe(false);
  });

  it('rejects a text item with no text', () => {
    const { textMessage: _textMessage, ...withoutText } = incomingItem;

    expect(isChatHistoryItem(withoutText)).toBe(false);
  });

  it('rejects a string timestamp, which would sort as NaN', () => {
    expect(isChatHistoryItem({ ...incomingItem, timestamp: '1763115112' })).toBe(false);
  });

  it('rejects a numeric idMessage', () => {
    expect(isChatHistoryItem({ ...incomingItem, idMessage: 7 })).toBe(false);
  });

  it('rejects an unknown direction', () => {
    expect(isChatHistoryItem({ ...incomingItem, type: 'sideways' })).toBe(false);
  });

  it('rejects an undocumented message type', () => {
    expect(isChatHistoryItem({ ...incomingItem, typeMessage: 'stickerMessage' })).toBe(
      false,
    );
  });

  it('rejects an undocumented chat type', () => {
    expect(isChatHistoryItem({ ...incomingItem, chatType: 'broadcast' })).toBe(false);
  });

  it('rejects an incoming item with no sender name', () => {
    const { senderName: _senderName, ...withoutSender } = incomingItem;

    expect(isChatHistoryItem(withoutSender)).toBe(false);
  });

  it('rejects an outgoing item with no delivery status', () => {
    const { statusMessage: _statusMessage, ...withoutStatus } = outgoing;

    expect(isChatHistoryItem(withoutStatus)).toBe(false);
  });

  it('rejects a present but wrongly typed forwardingScore', () => {
    expect(isChatHistoryItem({ ...incomingItem, forwardingScore: 'two' })).toBe(false);
  });
});

describe('isChatItem', () => {
  // An entry from the GetChats response example, verbatim.
  const supergroup = {
    chatId: '-10000000000000',
    name: 'GREEN-API Super Group',
    type: 'supergroup',
    phoneNumber: 0,
    username: '@green_api_supergroup',
  };

  it('accepts the documented response example', () => {
    expect(isChatItem(supergroup)).toBe(true);
  });

  it('accepts a group with a hidden number and no username', () => {
    expect(isChatItem({ ...supergroup, type: 'group', username: '' })).toBe(true);
  });

  it('rejects an undocumented chat type', () => {
    expect(isChatItem({ ...supergroup, type: 'bot' })).toBe(false);
  });

  it('rejects a string phoneNumber', () => {
    expect(isChatItem({ ...supergroup, phoneNumber: '79001234567' })).toBe(false);
  });

  it('rejects a chat with no name, which would render as blank', () => {
    const { name: _name, ...withoutName } = supergroup;

    expect(isChatItem(withoutName)).toBe(false);
  });

  it('rejects a non-object', () => {
    expect(isChatItem('nonsense')).toBe(false);
  });
});

describe('isInstanceSettings', () => {
  const settings = {
    wid: '79876543210@c.us',
    typeInstance: 'telegram',
    webhookUrl: '',
    webhookUrlToken: '',
    delaySendMessagesMilliseconds: 500,
    markIncomingMessagesReaded: 'no',
    markIncomingMessagesReadedOnReply: 'no',
    outgoingWebhook: 'yes',
    outgoingMessageWebhook: 'yes',
    outgoingAPIMessageWebhook: 'yes',
    incomingWebhook: 'yes',
    stateWebhook: 'yes',
    keepOnlineStatus: 'no',
    editedMessageWebhook: 'yes',
    deletedMessageWebhook: 'yes',
  };

  it('accepts the documented response example', () => {
    expect(isInstanceSettings(settings)).toBe(true);
  });

  it('accepts a configured webhook url, which the setup planner then clears', () => {
    expect(isInstanceSettings({ ...settings, webhookUrl: 'https://mysite.test' })).toBe(
      true,
    );
  });

  it('rejects a boolean in place of a yes or no setting', () => {
    expect(isInstanceSettings({ ...settings, incomingWebhook: true })).toBe(false);
  });

  it('rejects a missing yes or no setting', () => {
    const { stateWebhook: _stateWebhook, ...withoutState } = settings;

    expect(isInstanceSettings(withoutState)).toBe(false);
  });

  it('rejects a string send delay', () => {
    expect(
      isInstanceSettings({ ...settings, delaySendMessagesMilliseconds: '500' }),
    ).toBe(false);
  });

  it('rejects a non-object', () => {
    expect(isInstanceSettings(null)).toBe(false);
  });
});

describe('isSetSettingsResponse', () => {
  it('accepts the documented response example', () => {
    expect(isSetSettingsResponse({ saveSettings: true })).toBe(true);
  });

  it('accepts a refusal to save', () => {
    expect(isSetSettingsResponse({ saveSettings: false })).toBe(true);
  });

  it('rejects a stringified flag', () => {
    expect(isSetSettingsResponse({ saveSettings: 'true' })).toBe(false);
  });

  it('rejects an empty body', () => {
    expect(isSetSettingsResponse({})).toBe(false);
  });
});

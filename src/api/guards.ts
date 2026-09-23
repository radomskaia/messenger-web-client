import {
  CHAT_KINDS,
  CHAT_TYPES,
  HISTORY_MESSAGE_TYPES,
  MESSAGE_STATUSES,
  TEXT_MESSAGE_WEBHOOKS,
} from './types';

import type {
  ChatHistoryItem,
  ChatItem,
  CheckAccountResponse,
  SendMessageResponse,
  TextMessageNotification,
  TextMessageWebhook,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isMember<T extends string>(values: readonly T[], value: unknown): value is T {
  return values.includes(value as T);
}

function isOptional(
  value: unknown,
  isExpected: (candidate: unknown) => boolean,
): boolean {
  return value === undefined || isExpected(value);
}

function isTextMessageWebhook(value: unknown): value is TextMessageWebhook {
  return TEXT_MESSAGE_WEBHOOKS.includes(value as TextMessageWebhook);
}

function isUnixTimestamp(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
    return false;
  }

  const date = new Date(value * 1000);

  return !Number.isNaN(date.getTime());
}

export function isTextMessageNotification(
  body: unknown,
): body is TextMessageNotification {
  if (
    !isRecord(body) ||
    !isTextMessageWebhook(body['typeWebhook']) ||
    !isString(body['idMessage']) ||
    !isUnixTimestamp(body['timestamp'])
  ) {
    return false;
  }

  const { senderData, messageData } = body;

  if (
    !isRecord(senderData) ||
    !isString(senderData['chatId']) ||
    !isRecord(messageData) ||
    messageData['typeMessage'] !== 'textMessage' ||
    !isOptional(senderData['senderName'], isString) ||
    !isOptional(senderData['chatName'], isString)
  ) {
    return false;
  }

  const { textMessageData } = messageData;

  return isRecord(textMessageData) && isString(textMessageData['textMessage']);
}

export function isSendMessageResponse(value: unknown): value is SendMessageResponse {
  return isRecord(value) && isString(value['idMessage']);
}

export function isCheckAccountResponse(value: unknown): value is CheckAccountResponse {
  return (
    isRecord(value) &&
    isBoolean(value['exist']) &&
    isString(value['chatId']) &&
    isOptional(value['username'], isString) &&
    isOptional(value['phoneNumber'], isNumber) &&
    isOptional(value['fromCache'], isBoolean)
  );
}

function hasDirectionFields(item: Record<string, unknown>): boolean {
  switch (item['type']) {
    case 'incoming': {
      return (
        isString(item['senderName']) &&
        isMember(CHAT_KINDS, item['senderType']) &&
        isOptional(item['senderContactName'], isString)
      );
    }

    case 'outgoing': {
      return (
        isMember(MESSAGE_STATUSES, item['statusMessage']) && isBoolean(item['sendByApi'])
      );
    }

    default: {
      return false;
    }
  }
}

function hasMessageFields(item: Record<string, unknown>): boolean {
  switch (item['typeMessage']) {
    case 'textMessage': {
      return isString(item['textMessage']);
    }

    case 'pollMessage':
    case 'locationMessage': {
      return true;
    }

    default: {
      return (
        isString(item['downloadUrl']) &&
        isOptional(item['caption'], isString) &&
        isOptional(item['fileName'], isString) &&
        isOptional(item['jpegThumbnail'], isString) &&
        isOptional(item['mimeType'], isString) &&
        isOptional(item['isAnimated'], isBoolean)
      );
    }
  }
}

export function isChatHistoryItem(value: unknown): value is ChatHistoryItem {
  return (
    isRecord(value) &&
    isString(value['idMessage']) &&
    isUnixTimestamp(value['timestamp']) &&
    isString(value['chatId']) &&
    isMember(CHAT_KINDS, value['chatType']) &&
    isMember(HISTORY_MESSAGE_TYPES, value['typeMessage']) &&
    isOptional(value['forwardingScore'], isNumber) &&
    hasDirectionFields(value) &&
    hasMessageFields(value)
  );
}

export function isChatItem(value: unknown): value is ChatItem {
  return (
    isRecord(value) &&
    isString(value['chatId']) &&
    isString(value['name']) &&
    isMember(CHAT_TYPES, value['type']) &&
    isNumber(value['phoneNumber']) &&
    isString(value['username'])
  );
}

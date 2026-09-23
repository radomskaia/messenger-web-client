import type { Credentials } from '@/domain/types';

import { request } from './client';
import {
  isChatHistoryItem,
  isChatItem,
  isCheckAccountResponse,
  isInstanceSettings,
  isSendMessageResponse,
  isSetSettingsResponse,
} from './guards';

import type {
  ChatHistoryItem,
  ChatItem,
  CheckAccountResponse,
  InstanceSettings,
  NotificationEnvelope,
  SendMessagePayload,
  SendMessageResponse,
  SetSettingsResponse,
  SettingsPatch,
} from './types';

const DEFAULT_HISTORY_COUNT = 100;
const DIGITS_ONLY = /^\d+$/u;

export async function sendMessage(
  credentials: Credentials,
  payload: SendMessagePayload,
): Promise<SendMessageResponse> {
  const response = await request<SendMessageResponse>({
    credentials,
    method: 'POST',
    endpoint: 'sendMessage',
    body: payload,
  });

  if (!isSendMessageResponse(response)) {
    throw new Error('sendMessage returned a body of an unexpected shape');
  }

  return response;
}

export function receiveNotification(
  credentials: Credentials,
  options: { receiveTimeoutSeconds: number; signal?: AbortSignal },
): Promise<NotificationEnvelope | null> {
  return request<NotificationEnvelope>({
    credentials,
    method: 'GET',
    endpoint: 'receiveNotification',
    search: { receiveTimeout: String(options.receiveTimeoutSeconds) },
    ...(options.signal !== undefined && { signal: options.signal }),
  });
}

export async function deleteNotification(
  credentials: Credentials,
  receiptId: number,
): Promise<void> {
  await request({
    credentials,
    method: 'DELETE',
    endpoint: 'deleteNotification',
    extraSegments: [String(receiptId)],
  });
}

export async function checkAccount(
  credentials: Credentials,
  phoneNumber: string,
): Promise<CheckAccountResponse> {
  if (!DIGITS_ONLY.test(phoneNumber)) {
    throw new Error(`checkAccount expects digits only, received "${phoneNumber}"`);
  }

  const response = await request<CheckAccountResponse>({
    credentials,
    method: 'POST',
    endpoint: 'checkAccount',
    body: { phoneNumber: Number(phoneNumber) },
  });

  if (!isCheckAccountResponse(response)) {
    throw new Error('checkAccount returned a body of an unexpected shape');
  }

  return response;
}

export async function getChatHistory(
  credentials: Credentials,
  chatId: string,
  count: number = DEFAULT_HISTORY_COUNT,
): Promise<ChatHistoryItem[]> {
  const response = await request<ChatHistoryItem[]>({
    credentials,
    method: 'POST',
    endpoint: 'getChatHistory',
    body: { chatId, count },
  });

  return (response ?? []).filter((item) => isChatHistoryItem(item));
}

export async function getChatList(credentials: Credentials): Promise<ChatItem[]> {
  const response = await request<ChatItem[]>({
    credentials,
    method: 'GET',
    endpoint: 'getChats',
  });

  return (response ?? []).filter((item) => isChatItem(item));
}

export async function getSettings(credentials: Credentials): Promise<InstanceSettings> {
  const response = await request<InstanceSettings>({
    credentials,
    method: 'GET',
    endpoint: 'getSettings',
  });

  if (!isInstanceSettings(response)) {
    throw new Error('getSettings returned a body of an unexpected shape');
  }

  return response;
}

export async function setSettings(
  credentials: Credentials,
  patch: SettingsPatch,
): Promise<void> {
  if (Object.keys(patch).length === 0) {
    throw new Error('setSettings needs at least one setting to change');
  }

  const response = await request<SetSettingsResponse>({
    credentials,
    method: 'POST',
    endpoint: 'setSettings',
    body: patch,
  });

  if (!isSetSettingsResponse(response)) {
    throw new Error('setSettings returned a body of an unexpected shape');
  }

  if (!response.saveSettings) {
    throw new Error('setSettings reported that the settings were not saved');
  }
}

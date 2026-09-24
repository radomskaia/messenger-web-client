import type { ChatHistoryItem, TextMessageNotification } from '@/api/types';
import type { Chat, Message } from '@/domain/types';

const MILLISECONDS_PER_SECOND = 1000;

export function chatTitle(chat: Chat): string {
  let phoneNumber: string | undefined;

  if (chat.phoneNumber) {
    phoneNumber = `+${String(chat.phoneNumber)}`;
  }

  return chat.name ?? phoneNumber ?? chat.username ?? chat.chatId;
}

export function notificationToMessage(notification: TextMessageNotification): Message {
  return {
    idMessage: notification.idMessage,
    chatId: notification.senderData.chatId,
    direction:
      notification.typeWebhook === 'incomingMessageReceived' ? 'incoming' : 'outgoing',
    text: notification.messageData.textMessageData.textMessage,
    timestamp: notification.timestamp * MILLISECONDS_PER_SECOND,
    status: 'sent',
  };
}

export function historyItemToMessage(item: ChatHistoryItem): Message | null {
  if (item.typeMessage !== 'textMessage') {
    return null;
  }

  return {
    idMessage: item.idMessage,
    chatId: item.chatId,
    direction: item.type,
    text: item.textMessage,
    timestamp: item.timestamp * MILLISECONDS_PER_SECOND,
    status: 'sent',
  };
}

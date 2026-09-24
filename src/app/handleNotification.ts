import { isTextMessageNotification } from '@/api/guards';
import { notificationToMessage } from '@/domain/mappers';
import { useChatsStore } from '@/store/chatsStore';

export function handleNotification(body: unknown): void {
  if (!isTextMessageNotification(body)) {
    return;
  }

  const message = notificationToMessage(body);
  const store = useChatsStore.getState();

  const isIncoming = body.typeWebhook === 'incomingMessageReceived';

  store.mergeChats([
    {
      chatId: message.chatId,
      ...(isIncoming && { name: body.senderData.senderName }),
      lastMessageAt: message.timestamp,
    },
  ]);
  store.addMessage(message);

  if (isIncoming && message.chatId !== store.activeChatId) {
    store.incrementUnread(message.chatId);
  }
}

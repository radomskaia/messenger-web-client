import { isTextMessageNotification } from '@/api/guards';
import { notificationToMessage } from '@/domain/mappers';
import { useChatsStore } from '@/store/chatsStore';

export function handleNotification(body: unknown): void {
  if (!isTextMessageNotification(body)) {
    return;
  }

  const message = notificationToMessage(body);
  const store = useChatsStore.getState();

  store.mergeChats([
    {
      chatId: message.chatId,
      ...(body.typeWebhook === 'incomingMessageReceived' && {
        name: body.senderData.senderName,
      }),
      lastMessageAt: message.timestamp,
    },
  ]);
  store.addMessage(message);
}

import { isTooManyRequests } from '@/api/errors';
import { sendMessage } from '@/api/methods';
import type { Credentials } from '@/domain/types';
import { useChatsStore } from '@/store/chatsStore';
import { useToastStore } from '@/store/toastStore';

// eslint-disable-next-line unicorn/consistent-boolean-name
export async function sendTextMessage(
  credentials: Credentials,
  chatId: string,
  text: string,
): Promise<boolean> {
  const temporaryId = `temp-${String(Date.now())}-${String(Math.random())}`;
  const timestamp = Date.now();
  const store = useChatsStore.getState();

  store.addMessage({
    idMessage: temporaryId,
    chatId,
    direction: 'outgoing',
    text,
    timestamp,
    status: 'pending',
  });

  try {
    const response = await sendMessage(credentials, { chatId, message: text });

    useChatsStore.getState().replaceMessageId(chatId, temporaryId, {
      idMessage: response.idMessage,
      chatId,
      direction: 'outgoing',
      text,
      timestamp,
      status: 'sent',
    });

    return true;
  } catch (error) {
    useToastStore
      .getState()
      .push(isTooManyRequests(error) ? 'toast.tooManyRequests' : 'toast.sendFailed');
    useChatsStore.getState().removeMessage(chatId, temporaryId);

    return false;
  }
}

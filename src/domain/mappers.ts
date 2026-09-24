import type { Chat } from '@/domain/types';

export function chatTitle(chat: Chat): string {
  let phoneNumber: string | undefined;

  if (chat.phoneNumber) {
    phoneNumber = `+${String(chat.phoneNumber)}`;
  }

  return chat.name ?? phoneNumber ?? chat.username ?? chat.chatId;
}

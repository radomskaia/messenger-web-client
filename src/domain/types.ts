export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}

export type MessageDirection = 'incoming' | 'outgoing';

export type MessageStatus = 'pending' | 'sent' | 'failed';

export type ConnectionStatus = 'idle' | 'online' | 'reconnecting';

export interface Chat {
  chatId: string;
  name?: string;
  username?: string;
  phoneNumber?: number;
  lastMessageAt: number;
}

export interface Message {
  idMessage: string;
  chatId: string;
  direction: MessageDirection;
  text: string;
  timestamp: number;
  status: MessageStatus;
}

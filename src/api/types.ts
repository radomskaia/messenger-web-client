export const TEXT_MESSAGE_WEBHOOKS = [
  'incomingMessageReceived',
  'outgoingMessageReceived',
  'outgoingAPIMessageReceived',
] as const;

export type TextMessageWebhook = (typeof TEXT_MESSAGE_WEBHOOKS)[number];

type ChatId = string;
type MessageId = string;

export const CHAT_TYPES = ['user', 'group', 'supergroup', 'channel'] as const;

export type ChatType = (typeof CHAT_TYPES)[number];

export const CHAT_KINDS = [...CHAT_TYPES, 'bot'] as const;

export type ChatKind = (typeof CHAT_KINDS)[number];

export const HISTORY_MESSAGE_TYPES = [
  'textMessage',
  'imageMessage',
  'videoMessage',
  'documentMessage',
  'audioMessage',
  'pollMessage',
  'locationMessage',
] as const;

export const MESSAGE_STATUSES = ['delivered', 'read'] as const;

export type MessageStatus = (typeof MESSAGE_STATUSES)[number];
type TypingType =
  | 'text'
  | 'record_voice_note'
  | 'upload_voice_note'
  | 'record_video_note'
  | 'upload_video_note'
  | 'record_video'
  | 'upload_video'
  | 'upload_photo'
  | 'upload_document'
  | 'choose_sticker'
  | 'choose_location'
  | 'choose_contact';

export interface TextMessageNotification {
  typeWebhook: TextMessageWebhook;
  idMessage: MessageId;
  timestamp: number;
  senderData: {
    chatId: ChatId;
    senderName?: string;
    chatName?: string;
  };
  messageData: {
    typeMessage: 'textMessage';
    textMessageData: { textMessage: string };
  };
}

export interface NotificationEnvelope {
  receiptId: number;
  body: unknown;
}

export interface SendMessagePayload {
  chatId: ChatId;
  message: string;
  quotedMessageId?: string;
  typingTime?: number;
  typingType?: TypingType;
}

export interface SendMessageResponse {
  idMessage: MessageId;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId: ChatId;
  username?: string;
  phoneNumber?: number;
  fromCache?: boolean;
}

export interface ChatItem {
  chatId: ChatId;
  name: string;
  type: ChatType;
  phoneNumber: number;
  username: string;
}

interface ChatHistoryItemBase {
  idMessage: MessageId;
  timestamp: number;
  chatId: ChatId;
  chatType: ChatKind;
  isForwarded?: boolean;
  forwardingScore?: number;
}

interface TextChatHistoryMessage {
  typeMessage: 'textMessage';
  textMessage: string;
}

interface MediaChatHistoryMessage {
  typeMessage: 'imageMessage' | 'videoMessage' | 'documentMessage' | 'audioMessage';
  downloadUrl: string;
  caption?: string;
  fileName?: string;
  jpegThumbnail?: string;
  mimeType?: string;
  isAnimated?: boolean;
}

interface OtherChatHistoryMessage {
  typeMessage: 'pollMessage' | 'locationMessage';
}

type ChatHistoryMessage =
  TextChatHistoryMessage | MediaChatHistoryMessage | OtherChatHistoryMessage;

type IncomingChatHistoryItem = ChatHistoryItemBase & {
  type: 'incoming';
  senderName: string;
  senderType: ChatKind;
  senderContactName?: string;
};

type OutgoingChatHistoryItem = ChatHistoryItemBase & {
  type: 'outgoing';
  statusMessage: MessageStatus;
  sendByApi: boolean;
};

export type ChatHistoryItem =
  | (IncomingChatHistoryItem & ChatHistoryMessage)
  | (OutgoingChatHistoryItem & ChatHistoryMessage);

export const YES_NO = ['yes', 'no'] as const;

export type YesNo = (typeof YES_NO)[number];

export const YES_NO_SETTINGS = [
  'markIncomingMessagesReaded',
  'markIncomingMessagesReadedOnReply',
  'outgoingWebhook',
  'outgoingMessageWebhook',
  'outgoingAPIMessageWebhook',
  'incomingWebhook',
  'stateWebhook',
  'keepOnlineStatus',
  'editedMessageWebhook',
  'deletedMessageWebhook',
] as const;

type YesNoSettings = Record<(typeof YES_NO_SETTINGS)[number], YesNo>;

export interface InstanceSettings extends YesNoSettings {
  wid: string;
  typeInstance: string;
  webhookUrl: string;
  webhookUrlToken: string;
  delaySendMessagesMilliseconds: number;
}

export type SettingsPatch = Partial<Omit<InstanceSettings, 'wid' | 'typeInstance'>>;

export interface SetSettingsResponse {
  saveSettings: boolean;
}

export interface DeleteNotificationResponse {
  result: boolean;
  reason: string;
}

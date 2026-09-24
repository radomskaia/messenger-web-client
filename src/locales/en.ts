export const en = {
  toast: {
    tooManyRequests: 'Too many requests, try again',
    sendFailed: 'Could not send the message',
  },
  auth: {
    heading: 'Sign in with GREEN-API',
    idInstance: 'idInstance',
    apiToken: 'apiTokenInstance',
    apiUrl: 'API URL',
    submit: 'Sign in',
    required: 'Fill in both fields',
    unauthorized: 'GREEN-API rejected these credentials',
    checking: 'Checking…',
    network: 'Could not reach GREEN-API. Check your connection and try again.',
    failed: 'Something went wrong. Try again.',
    expired: 'Your GREEN-API instance has expired. Renew it in the console.',
    deleted: 'This GREEN-API instance no longer exists.',
    notAuthorized:
      'This instance is not authorized. Authorize it in the GREEN-API console.',
    webhookDialog: {
      title: 'Receive messages in this app?',
      current: 'This instance already sends its notifications to:',
      consequence:
        'Messages can go to one place only. If this app takes them over, that address stops receiving them.',
      confirm: 'Take over',
      cancel: 'Keep it there',
    },
    webhookDeclined:
      "Messages keep going to the other address, so they can't be shown here.",
    hint: 'Credentials are stored in this browser only.',
    console:
      'Find idInstance and apiTokenInstance in the <consoleLink>GREEN-API console</consoleLink>, or create an instance there.',
  },
  session: {
    checking: 'Checking your GREEN-API instance…',
    retry: 'Try again',
    signOut: 'Sign out',
  },
  chats: {
    heading: 'Chats',
    newChat: 'New chat',
    empty: 'No chats yet. Start one with a phone number.',
    selectPrompt: 'Select a chat to start messaging',
    toBottom: 'Scroll to the latest messages',
    back: 'Back to chats',
    unreadCount: '{{count}} unread',
    newMessages: 'Unread messages',
    loadingHistory: 'Loading history',
  },
  newChat: {
    heading: 'New chat',
    phone: 'Phone number',
    phonePlaceholder: '+7 900 123-45-67',
    submit: 'Create',
    cancel: 'Cancel',
    invalidPhone: 'Enter a valid phone number',
    notFound: 'No Telegram account found for this number',
    failed: 'Could not check the number, try again',
  },
  composer: {
    placeholder: 'Write a message',
    send: 'Send',
  },
  connection: {
    online: 'Connected',
    reconnecting: 'Reconnecting…',
  },
  message: {
    failed: 'Not sent',
    you: 'You',
    contact: 'Contact',
  },
  settings: {
    language: 'Language',
    themeLabel: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    signOut: 'Sign out',
  },
} as const;

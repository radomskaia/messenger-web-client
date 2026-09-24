export const en = {
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
} as const;

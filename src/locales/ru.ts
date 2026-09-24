export const ru = {
  auth: {
    heading: 'Вход через GREEN-API',
    idInstance: 'idInstance',
    apiToken: 'apiTokenInstance',
    apiUrl: 'Адрес API',
    submit: 'Войти',
    required: 'Заполните оба поля',
    unauthorized: 'GREEN-API не принял эти учётные данные',
    checking: 'Проверяем…',
    network:
      'Не удалось связаться с GREEN-API. Проверьте подключение и попробуйте ещё раз.',
    failed: 'Что-то пошло не так. Попробуйте ещё раз.',
    webhookDialog: {
      title: 'Получать сообщения в этом приложении?',
      current: 'Этот инстанс уже отправляет уведомления на адрес:',
      consequence:
        'Сообщения можно получать только в одном месте. Если приложение заберёт их себе, тот адрес перестанет их получать.',
      confirm: 'Забрать',
      cancel: 'Оставить там',
    },
    webhookDeclined:
      'Сообщения по-прежнему уходят на другой адрес, поэтому здесь их не показать.',
    hint: 'Учётные данные хранятся только в этом браузере.',
    console:
      'idInstance и apiTokenInstance есть в <consoleLink>консоли GREEN-API</consoleLink>. Там же можно создать инстанс.',
  },
  session: {
    checking: 'Проверяем инстанс GREEN-API…',
    retry: 'Попробовать снова',
    signOut: 'Выйти',
  },
} as const;

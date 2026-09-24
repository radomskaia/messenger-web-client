export const ru = {
  toast: {
    tooManyRequests: 'Слишком много запросов, попробуйте снова',
    sendFailed: 'Не удалось отправить сообщение',
  },
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
    expired: 'Срок действия инстанса GREEN-API истёк. Продлите его в консоли.',
    deleted: 'Этот инстанс GREEN-API больше не существует.',
    notAuthorized: 'Инстанс не авторизован. Авторизуйте его в консоли GREEN-API.',
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
  chats: {
    heading: 'Чаты',
    newChat: 'Новый чат',
    empty: 'Чатов пока нет. Начните с номера телефона.',
    selectPrompt: 'Выберите чат, чтобы начать переписку',
    toBottom: 'К последним сообщениям',
    back: 'К списку чатов',
  },
  newChat: {
    heading: 'Новый чат',
    phone: 'Номер телефона',
    phonePlaceholder: '+7 900 123-45-67',
    submit: 'Создать',
    cancel: 'Отмена',
    invalidPhone: 'Введите корректный номер телефона',
    notFound: 'Аккаунт Telegram с таким номером не найден',
    failed: 'Не удалось проверить номер, попробуйте ещё раз',
  },
  composer: {
    placeholder: 'Напишите сообщение',
    send: 'Отправить',
  },
  connection: {
    online: 'На связи',
    reconnecting: 'Переподключение…',
  },
  message: {
    failed: 'Не отправлено',
    you: 'Вы',
    contact: 'Собеседник',
  },
  settings: {
    language: 'Язык',
    themeLabel: 'Тема',
    themeLight: 'Светлая',
    themeDark: 'Тёмная',
    themeSystem: 'Системная',
    signOut: 'Выйти',
  },
} as const;

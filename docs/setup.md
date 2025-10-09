# Настройка проекта

## Требования

- Node.js 18 или новее
- npm 9 или новее

## Установка зависимостей

1. Скопируйте файл `.env.example` в `.env` и заполните `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
2. Установите зависимости:
   ```bash
   npm install
   ```

## Настройка API

1. В `.env` добавьте переменную `VITE_API_BASE_URL`, указывающую на базовый URL проекта Supabase без суффикса `functions/v1`.
2. Для локального запуска функций выполните:
   ```bash
   supabase start
   supabase functions serve cacheGet
   ```
3. Если указан неверный URL или функция не задеплоена, приложение вернёт ошибку `Requested function was not found`.

## Интеграции и фоновые обмены

### Ключи и доступы

- **Excel (Graph API)**: зарегистрируйте приложение в Azure AD, выдайте разрешения `Files.ReadWrite.All`, получите client secret. Передавайте публичный URL книги (`https://graph.microsoft.com/v1.0/...`) и имя листа.
- **Google Sheets**: создайте сервисный аккаунт в Google Cloud, скачайте JSON‑ключ и добавьте адрес аккаунта в редакторы таблицы.
- Сохраните значения в мастере интеграций — они попадут в таблицу `integration_sync_status`.

### Параметры импорта/экспорта

- Поддерживаемые форматы файлов: CSV, XLSX, XLS (первой строкой идут заголовки, кодировка UTF‑8).
- В запросах к функциям `import`/`export` можно передать `columnMapping` (JSON). Пример curl:

  ```bash
  curl -X POST \
    -H "Authorization: Bearer <service_role>" \
    -F "table=tasks" \
    -F "file=@tasks.xlsx" \
    -F 'columnMapping={"Task name":"title","Deadline":"due_date"}' \
    https://<project>.supabase.co/functions/v1/import
  ```

- Минимальные поля: `tasks` — `title`, `assignee`, `due_date`; `hardware` — `name`; `financial_transactions` — `amount`, `transaction_date`.
- Импорт выполняется батчами по 1000 строк — учитывайте ограничение Scheduler Supabase (минимальный интервал 1 минута).

### Настройка cron

1. В Supabase (Settings → Functions → Environment variables) задайте `INTEGRATION_CRON_SECRET` — строку, которой вы будете подписывать фоновые запросы.
2. Создайте задание Scheduler. Пример конфигурации:
   - Метод: `POST`
   - URL: `https://<project>.supabase.co/functions/v1/import-export?action=run`
   - Заголовок: `x-cron-secret: <ваш_секрет>`
   - Тело:

     ```json
     {
       "integration": "google_sheets_tasks",
       "direction": "import"
     }
     ```

3. Проверить статус можно GET‑запросом `https://<project>.supabase.co/functions/v1/import-export?action=status`.
4. В панели приложения отображается время последнего успешного обмена для задач и оборудования.

## Настройка безопасности Supabase

1. Клиентское приложение использует **только** ключ `VITE_SUPABASE_ANON_KEY`. Никогда не передавайте `service_role`-ключ в браузер.
2. Примените миграции для включения RLS и политик доступа:
   ```bash
   supabase db push
   ```
3. Таблицы `objects`, `hardware`, `tasks` и `chat_messages` защищены политиками, проверяющими членство пользователя в таблице `object_members` по полю `object_id`.
4. Чтобы выдать доступ к объекту, добавьте запись в `object_members` с `object_id` и `user_id` пользователя.

## Основные команды

- Запуск разработки:
  ```bash
  npm run dev
  ```
- Запуск тестов:
  ```bash
  npm test
  ```
- Сборка проекта:
  ```bash
  npm run build
  ```

## Настройка документации

### Локальный запуск

```bash
npm run docs:build && npm run docs:serve
```

Команда собирает документацию и поднимает локальный сервер для её просмотра.

### Проверка публикации CI

1. После пуша в `main` откройте вкладку **Actions** в репозитории и убедитесь, что workflow публикации документации завершился успешно.
2. Перейдите на опубликованную страницу документации и убедитесь, что последние изменения доступны.

## Деплой

### Vercel

1. Подключите репозиторий в Vercel.
2. В **Settings → Environment Variables** добавьте `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
3. В **Build & Development Settings** укажите команду `npm run build` и директорию `dist`.
4. Запустите деплой.

### Netlify

1. Подключите репозиторий в Netlify.
2. В **Site Configuration → Environment variables** добавьте `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
3. Укажите команду сборки `npm run build` и директорию публикации `dist`.
4. Запустите деплой.

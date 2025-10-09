# Настройка проекта

## Требования

- Node.js 18 или новее
- npm 9 или новее

## Установка зависимостей

1. Скопируйте файл `.env.example` в `.env` и заполните `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, а также секреты `SIGNATURE_TOTP_SECRET` и `SIGNATURE_SECRET` (произвольные случайные строки длиной от 32 символов). Необязательная переменная `SIGNATURE_ISSUER` задаёт имя поставщика TOTP.
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
supabase functions serve signature
```

3. Если указан неверный URL или функция не задеплоена, приложение вернёт ошибку `Requested function was not found`.

## Подпись операций

- После применения миграций в таблицах `tasks` и `financial_transactions` появятся поля `signed_by`, `signed_at`, `signature_hash`. Они автоматически заполняются фронтендом после успешной проверки TOTP‑кода через edge‑функцию `signature`.
- Для генерации кодов TOTP используйте любой совместимый генератор (Google Authenticator, 1Password и др.), укажите секрет `SIGNATURE_TOTP_SECRET`, добавьте идентификатор пользователя (например, email) — из него функция формирует индивидуальные ключи.
- Журнал аудита (`audit_logs`) записывает операции даже при серверных вызовах: функция `log_audit_changes` использует `signed_by` как fallback, чтобы не терять автора действия.

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

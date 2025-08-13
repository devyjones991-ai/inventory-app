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

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
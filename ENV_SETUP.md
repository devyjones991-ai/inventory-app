# 🔧 Настройка переменных окружения

## Создание .env файла

### 1. Локально (на вашем компьютере):

```bash
# Создайте .env файл в корне проекта
echo "# Supabase Configuration
VITE_SUPABASE_URL=https://ldbdqkbstlhugikalpin.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmRxa2JzdGxodWdpa2FscGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzA4OTIsImV4cCI6MjA2OTM0Njg5Mn0.V9V20mwbCzfWYXn2HZGyjWRhFiu6TW0uw_s-WiiipTg

# API Configuration (optional)
VITE_API_BASE_URL=https://multiminder.duckdns.org/api" > .env
```

### 2. На сервере:

```bash
# Создайте .env файл на сервере
sudo nano /var/www/multiminder.duckdns.org/.env
```

**Содержимое для сервера:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://ldbdqkbstlhugikalpin.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmRxa2JzdGxodWdpa2FscGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzA4OTIsImV4cCI6MjA2OTM0Njg5Mn0.V9V20mwbCzfWYXn2HZGyjWRhFiu6TW0uw_s-WiiipTg

# API Configuration (optional)
VITE_API_BASE_URL=https://multiminder.duckdns.org/api
```

### 3. Альтернативный способ (через env.js):

Можете также настроить через `public/env.js`:

```javascript
window.__ENV = {
  VITE_SUPABASE_URL: "https://ldbdqkbstlhugikalpin.supabase.co",
  VITE_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmRxa2JzdGxodWdpa2FscGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzA4OTIsImV4cCI6MjA2OTM0Njg5Mn0.V9V20mwbCzfWYXn2HZGyjWRhFiu6TW0uw_s-WiiipTg",
  VITE_API_BASE_URL: "https://multiminder.duckdns.org/api",
};
```

## Проверка настройки

После создания .env файла:

1. **Перезапустите dev сервер:**

   ```bash
   npm run dev
   ```

2. **Проверьте в браузере:**
   - Если переменные настроены правильно - приложение загрузится
   - Если нет - увидите страницу с предупреждением о недостающих переменных

## Безопасность

- ✅ .env файл уже добавлен в .gitignore
- ✅ .env файл не будет закоммичен в репозиторий
- ✅ На сервере создайте .env отдельно

## Ваши данные Supabase

- **URL:** https://ldbdqkbstlhugikalpin.supabase.co
- **Anon Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmRxa2JzdGxodWdpa2FscGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzA4OTIsImV4cCI6MjA2OTM0Njg5Mn0.V9V20mwbCzfWYXn2HZGyjWRhFiu6TW0uw_s-WiiipTg

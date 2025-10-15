# Настройка Supabase для работы чата

## Проблема
Чат не работает, потому что не настроены переменные окружения для Supabase.

## Решение

### 1. Создайте проект в Supabase
1. Перейдите на [supabase.com](https://supabase.com)
2. Войдите в аккаунт или создайте новый
3. Создайте новый проект
4. Дождитесь завершения настройки

### 2. Получите настройки проекта
1. В панели Supabase перейдите в Settings → API
2. Скопируйте:
   - **Project URL** (например: `https://your-project-id.supabase.co`)
   - **anon public** ключ (длинная строка, начинающаяся с `eyJ...`)

### 3. Настройте переменные окружения

#### Вариант A: Через .env файл (рекомендуется)
1. Создайте файл `.env` в корне проекта
2. Добавьте:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Вариант B: Через public/env.js
1. Откройте файл `public/env.js`
2. Замените временные значения на реальные:
```javascript
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: "https://your-project-id.supabase.co",
  VITE_SUPABASE_ANON_KEY: "your-anon-key-here",
  VITE_API_BASE_URL: "http://localhost:3000/api",
};
```

### 4. Создайте таблицу chat_messages
1. В панели Supabase перейдите в SQL Editor
2. Выполните следующий SQL:

```sql
-- Создание таблицы chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  object_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_chat_messages_object_id ON chat_messages(object_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- Включение RLS (Row Level Security)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Политика доступа (пользователи могут видеть только сообщения объектов, к которым у них есть доступ)
CREATE POLICY "Users can view chat messages for accessible objects" ON chat_messages
  FOR SELECT USING (
    object_id IN (
      SELECT id FROM objects WHERE user_email = auth.jwt() ->> 'email'
    )
  );

-- Политика создания сообщений
CREATE POLICY "Users can create chat messages for accessible objects" ON chat_messages
  FOR INSERT WITH CHECK (
    object_id IN (
      SELECT id FROM objects WHERE user_email = auth.jwt() ->> 'email'
    )
  );
```

### 5. Перезапустите приложение
```bash
npm run dev
```

## Проверка
После настройки:
1. Откройте приложение
2. Выберите любой объект
3. Перейдите на вкладку "Чат"
4. Чат должен загрузиться без ошибок

## Дополнительные настройки
Если у вас есть таблица `objects`, убедитесь, что в ней есть поле `user_email` для корректной работы политик безопасности.

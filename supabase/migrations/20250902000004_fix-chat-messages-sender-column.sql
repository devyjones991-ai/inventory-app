-- Исправление структуры таблицы chat_messages
-- Проблема: код использует колонку 'sender', но в таблице есть только 'user_email'
-- Решение: добавляем колонку 'sender' и синхронизируем с 'user_email'

-- 1. Добавляем колонку 'sender' если её нет
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chat_messages' 
    AND column_name = 'sender'
  ) THEN
    ALTER TABLE public.chat_messages 
    ADD COLUMN sender TEXT;
  END IF;
END $$;

-- 2. Заполняем 'sender' значениями из 'user_email' для существующих записей
UPDATE public.chat_messages 
SET sender = user_email 
WHERE sender IS NULL;

-- 3. Делаем 'sender' NOT NULL после заполнения
ALTER TABLE public.chat_messages 
ALTER COLUMN sender SET NOT NULL;

-- 4. Создаем индекс для 'sender' если его нет
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender 
ON public.chat_messages(sender);

-- 5. Создаем триггер для автоматической синхронизации sender с user_email
CREATE OR REPLACE FUNCTION public.sync_chat_message_sender()
RETURNS TRIGGER AS $$
BEGIN
  -- Если sender не указан, используем user_email
  IF NEW.sender IS NULL OR NEW.sender = '' THEN
    NEW.sender := NEW.user_email;
  END IF;
  -- Если user_email не указан, используем sender
  IF NEW.user_email IS NULL OR NEW.user_email = '' THEN
    NEW.user_email := NEW.sender;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старый триггер если есть
DROP TRIGGER IF EXISTS sync_chat_message_sender_trigger ON public.chat_messages;

-- Создаем триггер
CREATE TRIGGER sync_chat_message_sender_trigger
  BEFORE INSERT OR UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_chat_message_sender();

-- 6. Добавляем колонку read_at если её нет (используется в уведомлениях)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'chat_messages' 
    AND column_name = 'read_at'
  ) THEN
    ALTER TABLE public.chat_messages 
    ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 7. Обновляем RLS политики для superuser (если миграция superuser уже применена)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' 
    AND policyname = 'Superuser can manage all chat_messages'
  ) THEN
    -- Политика уже существует, ничего не делаем
    NULL;
  ELSE
    -- Создаем политику для superuser
    CREATE POLICY "Superuser can manage all chat_messages" ON public.chat_messages
      FOR ALL USING (public.is_superuser())
      WITH CHECK (public.is_superuser());
  END IF;
END $$;


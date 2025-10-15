-- Создание таблицы chat_messages для чата
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
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_email ON chat_messages(user_email);

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

-- Политика обновления сообщений (только автор может редактировать)
CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (
    user_email = auth.jwt() ->> 'email'
  );

-- Политика удаления сообщений (только автор может удалять)
CREATE POLICY "Users can delete their own messages" ON chat_messages
  FOR DELETE USING (
    user_email = auth.jwt() ->> 'email'
  );

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

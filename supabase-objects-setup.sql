-- Создание таблицы objects если её нет
CREATE TABLE IF NOT EXISTS objects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  status TEXT,
  location TEXT,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для производительности
CREATE INDEX IF NOT EXISTS idx_objects_user_email ON objects(user_email);
CREATE INDEX IF NOT EXISTS idx_objects_created_at ON objects(created_at);

-- Включение RLS (Row Level Security)
ALTER TABLE objects ENABLE ROW LEVEL SECURITY;

-- Политика доступа (пользователи могут видеть только свои объекты)
CREATE POLICY "Users can view their own objects" ON objects
  FOR SELECT USING (user_email = auth.jwt() ->> 'email');

-- Политика создания объектов
CREATE POLICY "Users can create their own objects" ON objects
  FOR INSERT WITH CHECK (user_email = auth.jwt() ->> 'email');

-- Политика обновления объектов
CREATE POLICY "Users can update their own objects" ON objects
  FOR UPDATE USING (user_email = auth.jwt() ->> 'email');

-- Политика удаления объектов
CREATE POLICY "Users can delete their own objects" ON objects
  FOR DELETE USING (user_email = auth.jwt() ->> 'email');

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_objects_updated_at 
    BEFORE UPDATE ON objects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

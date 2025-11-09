-- Создание таблицы objects
CREATE TABLE IF NOT EXISTS public.objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  status TEXT,
  location TEXT,
  user_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_objects_user_email ON public.objects(user_email);
CREATE INDEX IF NOT EXISTS idx_objects_created_at ON public.objects(created_at);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_objects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_objects_updated_at 
    BEFORE UPDATE ON public.objects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_objects_updated_at();

-- Включение RLS
ALTER TABLE public.objects ENABLE ROW LEVEL SECURITY;

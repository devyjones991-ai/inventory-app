-- Создание таблицы hardware
CREATE TABLE IF NOT EXISTS public.hardware (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  purchase_status TEXT DEFAULT 'not_paid' CHECK (purchase_status IN ('not_paid', 'paid')),
  install_status TEXT DEFAULT 'not_installed' CHECK (install_status IN ('not_installed', 'installed')),
  object_id UUID NOT NULL REFERENCES public.objects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов
CREATE INDEX IF NOT EXISTS idx_hardware_object_id ON public.hardware(object_id);
CREATE INDEX IF NOT EXISTS idx_hardware_created_at ON public.hardware(created_at);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_hardware_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_hardware_updated_at 
    BEFORE UPDATE ON public.hardware 
    FOR EACH ROW 
    EXECUTE FUNCTION update_hardware_updated_at();

-- Включение RLS
ALTER TABLE public.hardware ENABLE ROW LEVEL SECURITY;


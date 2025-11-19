-- Добавление недостающих колонок в таблицу hardware
ALTER TABLE public.hardware
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS serial_number TEXT,
  ADD COLUMN IF NOT EXISTS purchase_date DATE,
  ADD COLUMN IF NOT EXISTS warranty_expiry DATE,
  ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS vendor TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS specifications JSONB;

-- Обновление существующих записей: установка значений по умолчанию
UPDATE public.hardware SET type = 'Не указан' WHERE type IS NULL;
UPDATE public.hardware SET status = 'active' WHERE status IS NULL;

-- Делаем type обязательным полем
ALTER TABLE public.hardware ALTER COLUMN type SET NOT NULL;

-- Создание индексов для новых колонок
CREATE INDEX IF NOT EXISTS idx_hardware_user_id ON public.hardware(user_id);
CREATE INDEX IF NOT EXISTS idx_hardware_status ON public.hardware(status);
CREATE INDEX IF NOT EXISTS idx_hardware_type ON public.hardware(type);


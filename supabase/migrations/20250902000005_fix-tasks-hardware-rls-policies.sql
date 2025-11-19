-- Исправление RLS политик для tasks и hardware
-- Проблема: политики с FOR ALL блокируют INSERT
-- Решение: разделить политики по операциям и добавить INSERT для аутентифицированных

-- ========== TASKS ==========

-- Удаляем старую политику
DROP POLICY IF EXISTS "Members manage tasks" ON public.tasks;

-- SELECT: только члены могут читать задачи
CREATE POLICY "Members can read tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = tasks.object_id AND om.user_id = auth.uid()
    )
  );

-- UPDATE: только члены могут обновлять задачи
CREATE POLICY "Members can update tasks" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = tasks.object_id AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = tasks.object_id AND om.user_id = auth.uid()
    )
  );

-- DELETE: только члены могут удалять задачи
CREATE POLICY "Members can delete tasks" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = tasks.object_id AND om.user_id = auth.uid()
    )
  );

-- INSERT: любой аутентифицированный пользователь может создавать задачи
-- (если он является членом объекта, он сможет их видеть и редактировать)
CREATE POLICY "Authenticated insert tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ========== HARDWARE ==========

-- Удаляем старую политику
DROP POLICY IF EXISTS "Members manage hardware" ON public.hardware;

-- SELECT: только члены могут читать оборудование
CREATE POLICY "Members can read hardware" ON public.hardware
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = hardware.object_id AND om.user_id = auth.uid()
    )
  );

-- UPDATE: только члены могут обновлять оборудование
CREATE POLICY "Members can update hardware" ON public.hardware
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = hardware.object_id AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = hardware.object_id AND om.user_id = auth.uid()
    )
  );

-- DELETE: только члены могут удалять оборудование
CREATE POLICY "Members can delete hardware" ON public.hardware
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = hardware.object_id AND om.user_id = auth.uid()
    )
  );

-- INSERT: любой аутентифицированный пользователь может создавать оборудование
-- (если он является членом объекта, он сможет его видеть и редактировать)
CREATE POLICY "Authenticated insert hardware" ON public.hardware
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ========== ОБНОВЛЕНИЕ ПОЛИТИК ДЛЯ SUPERUSER ==========

-- Убеждаемся, что политики для superuser существуют
-- (они должны быть созданы в миграции 20250902000003_add-superuser-role.sql)
-- Но на всякий случай проверяем и создаем если нужно

DO $$ 
BEGIN
  -- Tasks superuser policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'tasks' 
    AND policyname = 'Superuser can manage all tasks'
  ) THEN
    CREATE POLICY "Superuser can manage all tasks" ON public.tasks
      FOR ALL USING (public.is_superuser())
      WITH CHECK (public.is_superuser());
  END IF;

  -- Hardware superuser policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hardware' 
    AND policyname = 'Superuser can manage all hardware'
  ) THEN
    CREATE POLICY "Superuser can manage all hardware" ON public.hardware
      FOR ALL USING (public.is_superuser())
      WITH CHECK (public.is_superuser());
  END IF;
END $$;

-- ========== ДОБАВЛЕНИЕ user_id В HARDWARE ==========

-- Добавляем колонку user_id в hardware если её нет
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'hardware' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.hardware 
    ADD COLUMN user_id UUID REFERENCES auth.users(id);
    
    -- Создаем индекс
    CREATE INDEX IF NOT EXISTS idx_hardware_user_id 
    ON public.hardware(user_id);
  END IF;
END $$;

-- Триггер для автоматического заполнения user_id при создании hardware
CREATE OR REPLACE FUNCTION public.set_hardware_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_hardware_user_id_trigger ON public.hardware;
CREATE TRIGGER set_hardware_user_id_trigger
  BEFORE INSERT ON public.hardware
  FOR EACH ROW
  EXECUTE FUNCTION public.set_hardware_user_id();

-- Триггер для автоматического заполнения user_id при создании tasks (если его нет)
CREATE OR REPLACE FUNCTION public.set_task_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_task_user_id_trigger ON public.tasks;
CREATE TRIGGER set_task_user_id_trigger
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_task_user_id();


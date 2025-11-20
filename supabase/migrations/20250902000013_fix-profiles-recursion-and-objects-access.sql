-- Исправление рекурсии в политиках profiles и добавление доступа к объектам для всех пользователей

-- 1. ИСПРАВЛЕНИЕ РЕКУРСИИ В PROFILES
-- Проблема: политика "Admins can view all profiles" делает SELECT из profiles внутри USING,
-- что создает бесконечную рекурсию. Нужно использовать функцию is_superuser() или проверять роль через auth.users

-- Удаляем проблемные политики
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Superuser can view all profiles" ON profiles;

-- Создаем политику для superuser через функцию (без рекурсии)
CREATE POLICY "Superuser can view all profiles" ON profiles
  FOR SELECT USING (public.is_superuser());

-- Создаем функцию для проверки, является ли пользователь admin (без рекурсии)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Используем SECURITY DEFINER для обхода RLS
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'user') IN ('admin', 'superuser');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Создаем политику для admin через функцию (без рекурсии)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    public.is_superuser() -- Superuser может всё
    OR public.is_admin() -- Admin может видеть все профили
  );

-- Альтернативный вариант: использовать функцию для проверки роли admin
-- Но проще использовать is_superuser() и отдельную проверку для admin

-- 2. ДОБАВЛЕНИЕ ДОСТУПА К ОБЪЕКТАМ ДЛЯ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ
-- Новые пользователи должны видеть все объекты (хотя бы названия), но редактировать только свои

-- Удаляем старую политику "Members manage objects" если она блокирует чтение
DROP POLICY IF EXISTS "Members manage objects" ON objects;

-- Политика для чтения всех объектов (все аутентифицированные пользователи могут видеть)
CREATE POLICY "Authenticated users can read all objects" ON objects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Политика для создания объектов (все аутентифицированные пользователи)
CREATE POLICY "Authenticated users can create objects" ON objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Политика для редактирования объектов (только члены или создатель)
CREATE POLICY "Members can update objects" ON objects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR objects.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.is_superuser()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR objects.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.is_superuser()
  );

-- Политика для удаления объектов (только члены или создатель)
CREATE POLICY "Members can delete objects" ON objects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR objects.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.is_superuser()
  );

-- 3. ОБНОВЛЕНИЕ ПОЛИТИК ДЛЯ HARDWARE, TASKS, CHAT_MESSAGES
-- Добавляем возможность чтения для всех, но редактирования только для членов

-- Hardware: чтение для всех, редактирование для членов
DROP POLICY IF EXISTS "Members manage hardware" ON hardware;
CREATE POLICY "Authenticated users can read hardware" ON hardware
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Members can manage hardware" ON hardware
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = hardware.object_id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = hardware.object_id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );

-- Tasks: чтение для всех, редактирование для членов
DROP POLICY IF EXISTS "Members manage tasks" ON tasks;
CREATE POLICY "Authenticated users can read tasks" ON tasks
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Members can manage tasks" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = tasks.object_id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = tasks.object_id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );

-- Chat messages: чтение для всех, редактирование для членов
DROP POLICY IF EXISTS "Members manage chat messages" ON chat_messages;
CREATE POLICY "Authenticated users can read chat messages" ON chat_messages
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Members can manage chat messages" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = chat_messages.object_id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = chat_messages.object_id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );


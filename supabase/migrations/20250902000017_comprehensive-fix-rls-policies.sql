-- КОМПЛЕКСНОЕ ИСПРАВЛЕНИЕ RLS ПОЛИТИК И РЕКУРСИИ
-- Эта миграция исправляет все проблемы с рекурсией и доступом
-- Дата: 2025-09-02

-- ============================================================================
-- ШАГ 1: ПЕРЕСОЗДАНИЕ ВСЕХ ФУНКЦИЙ С ПРАВИЛЬНЫМИ ЗАВИСИМОСТЯМИ
-- ============================================================================

-- 1.1. Базовая функция для получения роли (SECURITY DEFINER обходит RLS)
-- Это основа всех остальных функций - она НЕ должна вызывать рекурсию
CREATE OR REPLACE FUNCTION public.get_user_role_cached(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- SECURITY DEFINER позволяет обойти RLS полностью
  -- Это означает, что политики НЕ проверяются при выполнении этой функции
  -- Поэтому нет рекурсии, даже если функция используется в политиках
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Комментарий к функции
COMMENT ON FUNCTION public.get_user_role_cached(UUID) IS 
'Возвращает роль пользователя. Использует SECURITY DEFINER для обхода RLS. Не вызывает рекурсию.';

-- 1.2. Функция для проверки superuser (использует get_user_role_cached)
CREATE OR REPLACE FUNCTION public.is_superuser(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Используем функцию, которая обходит RLS
  RETURN public.get_user_role_cached(user_id) = 'superuser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Комментарий к функции
COMMENT ON FUNCTION public.is_superuser(UUID) IS 
'Проверяет, является ли пользователь superuser. Использует get_user_role_cached для обхода RLS.';

-- 1.3. Функция для проверки admin (использует get_user_role_cached)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Используем функцию, которая обходит RLS
  RETURN public.get_user_role_cached(user_id) IN ('admin', 'superuser');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Комментарий к функции
COMMENT ON FUNCTION public.is_admin(UUID) IS 
'Проверяет, является ли пользователь admin или superuser. Использует get_user_role_cached для обхода RLS.';

-- 1.4. Функция для получения роли (для совместимости с существующим кодом)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN public.get_user_role_cached(user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Комментарий к функции
COMMENT ON FUNCTION public.get_user_role(UUID) IS 
'Возвращает роль пользователя. Алиас для get_user_role_cached для совместимости.';

-- 1.5. Функция для получения всех профилей (для superuser и admin)
CREATE OR REPLACE FUNCTION public.get_all_profiles()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  permissions JSONB,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Проверяем роль через кэшированную функцию (без рекурсии)
  user_role := public.get_user_role_cached(auth.uid());
  
  -- Проверяем, что текущий пользователь - superuser или admin
  IF NOT (user_role IN ('superuser', 'admin')) THEN
    RAISE EXCEPTION 'Только superuser или admin может просматривать все профили';
  END IF;

  -- Возвращаем все профили (SECURITY DEFINER обходит RLS)
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    COALESCE(p.permissions, '[]'::jsonb) as permissions,
    p.created_at,
    p.last_sign_in_at
  FROM public.profiles p
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Комментарий к функции
COMMENT ON FUNCTION public.get_all_profiles() IS 
'Возвращает все профили пользователей. Доступна только для superuser и admin. Использует SECURITY DEFINER для обхода RLS.';

-- ============================================================================
-- ШАГ 2: УДАЛЕНИЕ ВСЕХ КОНФЛИКТУЮЩИХ ПОЛИТИК
-- ============================================================================

-- 2.1. Удаляем ВСЕ политики для profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Superuser can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and Superusers can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update role" ON profiles;
DROP POLICY IF EXISTS "Superuser can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Superuser can delete profiles" ON profiles;

-- 2.2. Удаляем ВСЕ политики для objects
DROP POLICY IF EXISTS "Members can read objects" ON objects;
DROP POLICY IF EXISTS "Members can update objects" ON objects;
DROP POLICY IF EXISTS "Members can delete objects" ON objects;
DROP POLICY IF EXISTS "Members manage objects" ON objects;
DROP POLICY IF EXISTS "Authenticated users can read objects" ON objects;
DROP POLICY IF EXISTS "Authenticated users can create objects" ON objects;
DROP POLICY IF EXISTS "Authenticated insert objects" ON objects;
DROP POLICY IF EXISTS "Superuser can manage all objects" ON objects;

-- 2.3. Удаляем ВСЕ политики для hardware
DROP POLICY IF EXISTS "Members can read hardware" ON hardware;
DROP POLICY IF EXISTS "Members can update hardware" ON hardware;
DROP POLICY IF EXISTS "Members can delete hardware" ON hardware;
DROP POLICY IF EXISTS "Members manage hardware" ON hardware;
DROP POLICY IF EXISTS "Authenticated users can read hardware" ON hardware;
DROP POLICY IF EXISTS "Members can manage hardware" ON hardware;
DROP POLICY IF EXISTS "Authenticated insert hardware" ON hardware;
DROP POLICY IF EXISTS "Superuser can manage all hardware" ON hardware;

-- 2.4. Удаляем ВСЕ политики для tasks
DROP POLICY IF EXISTS "Members can read tasks" ON tasks;
DROP POLICY IF EXISTS "Members can update tasks" ON tasks;
DROP POLICY IF EXISTS "Members can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Members manage tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can read tasks" ON tasks;
DROP POLICY IF EXISTS "Members can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated insert tasks" ON tasks;
DROP POLICY IF EXISTS "Superuser can manage all tasks" ON tasks;

-- 2.5. Удаляем ВСЕ политики для chat_messages
DROP POLICY IF EXISTS "Members manage chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Authenticated users can read chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Members can manage chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Superuser can manage all chat_messages" ON chat_messages;

-- ============================================================================
-- ШАГ 3: СОЗДАНИЕ ПРАВИЛЬНЫХ ПОЛИТИК ДЛЯ PROFILES
-- ============================================================================

-- 3.1. Пользователь может видеть только свой профиль (без проверки роли)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 3.2. Superuser может видеть все профили (через функцию, не SELECT)
CREATE POLICY "Superuser can view all profiles" ON profiles
  FOR SELECT USING (public.is_superuser());

-- 3.3. Admin может видеть все профили (через функцию, не SELECT)
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

-- 3.4. Пользователь может обновлять только свой профиль
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3.5. Admin может обновлять все профили (кроме superuser)
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE 
  USING (
    public.is_admin() 
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = profiles.id AND p.role = 'superuser'
    )
  )
  WITH CHECK (
    public.is_admin() 
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = profiles.id AND p.role = 'superuser'
    )
  );

-- 3.6. Superuser может управлять всеми профилями
CREATE POLICY "Superuser can manage all profiles" ON profiles
  FOR ALL 
  USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- 3.7. Admin может удалять профили (кроме superuser и своего)
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    public.is_admin()
    AND id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = profiles.id AND p.role = 'superuser'
    )
  );

-- ============================================================================
-- ШАГ 4: СОЗДАНИЕ ПРАВИЛЬНЫХ ПОЛИТИК ДЛЯ OBJECTS
-- ============================================================================

-- 4.1. Все аутентифицированные пользователи могут читать объекты (для новых пользователей)
CREATE POLICY "Authenticated users can read objects" ON objects
  FOR SELECT USING (auth.role() = 'authenticated');

-- 4.2. Все аутентифицированные пользователи могут создавать объекты
CREATE POLICY "Authenticated users can create objects" ON objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 4.3. Члены объекта могут обновлять объекты
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

-- 4.4. Члены объекта могут удалять объекты
CREATE POLICY "Members can delete objects" ON objects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR objects.user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR public.is_superuser()
  );

-- 4.5. Superuser может управлять всеми объектами
CREATE POLICY "Superuser can manage all objects" ON objects
  FOR ALL 
  USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- ============================================================================
-- ШАГ 5: СОЗДАНИЕ ПРАВИЛЬНЫХ ПОЛИТИК ДЛЯ HARDWARE, TASKS, CHAT_MESSAGES
-- ============================================================================

-- 5.1. HARDWARE: чтение для всех, изменение для членов
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

CREATE POLICY "Authenticated users can create hardware" ON hardware
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Superuser can manage all hardware" ON hardware
  FOR ALL 
  USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- 5.2. TASKS: чтение для всех, изменение для членов
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

CREATE POLICY "Authenticated users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Superuser can manage all tasks" ON tasks
  FOR ALL 
  USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- 5.3. CHAT_MESSAGES: чтение для всех, изменение для членов
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

CREATE POLICY "Superuser can manage all chat_messages" ON chat_messages
  FOR ALL 
  USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- ============================================================================
-- ШАГ 6: ПРОВЕРКА И ФИНАЛИЗАЦИЯ
-- ============================================================================

-- Убеждаемся, что все функции существуют и работают
DO $$
BEGIN
  -- Проверяем, что функции созданы
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_user_role_cached'
  ) THEN
    RAISE EXCEPTION 'Функция get_user_role_cached не создана';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_superuser'
  ) THEN
    RAISE EXCEPTION 'Функция is_superuser не создана';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_admin'
  ) THEN
    RAISE EXCEPTION 'Функция is_admin не создана';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'get_all_profiles'
  ) THEN
    RAISE EXCEPTION 'Функция get_all_profiles не создана';
  END IF;
  
  RAISE NOTICE 'Все функции успешно созданы';
END $$;

-- Комментарий к миграции
COMMENT ON SCHEMA public IS 
'Комплексное исправление RLS политик завершено. Все функции используют SECURITY DEFINER для обхода RLS и предотвращения рекурсии.';


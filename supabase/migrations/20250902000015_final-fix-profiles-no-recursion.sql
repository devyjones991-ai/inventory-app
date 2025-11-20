-- ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ РЕКУРСИИ - ПОЛНОСТЬЮ УБИРАЕМ SELECT ИЗ PROFILES В ПОЛИТИКАХ
-- Используем только функции с SECURITY DEFINER, которые гарантированно не вызывают рекурсию

-- 1. Удаляем ВСЕ политики, которые могут вызывать рекурсию
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Superuser can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update role" ON profiles;
DROP POLICY IF EXISTS "Superuser can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 2. Создаем функцию для получения роли (использует SECURITY DEFINER для обхода RLS)
-- Эта функция НЕ будет вызывать рекурсию, так как она обходит RLS
CREATE OR REPLACE FUNCTION public.get_user_role_cached(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- SECURITY DEFINER позволяет обойти RLS и не создает рекурсию
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Обновляем is_superuser() чтобы использовать кэшированную функцию
CREATE OR REPLACE FUNCTION public.is_superuser(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Используем функцию, которая обходит RLS
  RETURN public.get_user_role_cached(user_id) = 'superuser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Обновляем is_admin() чтобы использовать кэшированную функцию
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Используем функцию, которая обходит RLS
  user_role := public.get_user_role_cached(user_id);
  RETURN user_role IN ('admin', 'superuser');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 5. Создаем политики БЕЗ использования SELECT из profiles в USING
-- Все проверки роли делаются через функции с SECURITY DEFINER

-- Политика 1: Пользователь может видеть свой профиль
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Политика 2: Superuser может видеть все профили (использует функцию, не SELECT)
CREATE POLICY "Superuser can view all profiles" ON profiles
  FOR SELECT USING (public.is_superuser());

-- Политика 3: Admin может видеть все профили (использует функцию, не SELECT)
-- ВАЖНО: is_admin() использует get_user_role_cached() с SECURITY DEFINER,
-- поэтому не создает рекурсию
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

-- Политики для обновления
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = public.get_user_role_cached() -- Используем функцию вместо SELECT
  );

CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Superuser can manage all profiles" ON profiles
  FOR ALL 
  USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- 6. Убеждаемся, что политики для удаления тоже используют функции
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    public.is_admin()
    AND id != auth.uid() -- Нельзя удалить свой профиль
  );


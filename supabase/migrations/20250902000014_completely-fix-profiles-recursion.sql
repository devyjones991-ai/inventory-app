-- ПОЛНОЕ ИСПРАВЛЕНИЕ РЕКУРСИИ В PROFILES
-- Проблема: любая политика, которая делает SELECT из profiles внутри USING, создает рекурсию
-- Решение: использовать только функции с SECURITY DEFINER, которые кэшируют результат

-- Удаляем ВСЕ политики для profiles, которые могут вызывать рекурсию
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Superuser can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- Создаем функцию для получения роли пользователя (кэшированная, без рекурсии)
-- Эта функция будет использоваться для проверки роли без SELECT из profiles в политиках
CREATE OR REPLACE FUNCTION public.get_user_role_cached(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Используем SECURITY DEFINER для обхода RLS
  -- Это позволяет читать профиль без проверки политик
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Обновляем is_superuser() чтобы использовать кэшированную функцию
CREATE OR REPLACE FUNCTION public.is_superuser(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_user_role_cached(user_id) = 'superuser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Обновляем is_admin() чтобы использовать кэшированную функцию
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := public.get_user_role_cached(user_id);
  RETURN user_role IN ('admin', 'superuser');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 1. Политика для просмотра своего профиля (без рекурсии)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. Политика для superuser (использует функцию, которая не вызывает рекурсию)
CREATE POLICY "Superuser can view all profiles" ON profiles
  FOR SELECT USING (public.is_superuser());

-- 3. Политика для admin (использует функцию, которая не вызывает рекурсию)
-- ВАЖНО: is_admin() использует get_user_role_cached(), которая с SECURITY DEFINER
-- обходит RLS и не создает рекурсию
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

-- Убеждаемся, что политики для обновления тоже не вызывают рекурсию
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = public.get_user_role_cached() -- Используем функцию вместо SELECT
  );

DROP POLICY IF EXISTS "Admins can update role" ON profiles;
CREATE POLICY "Admins can update role" ON profiles
  FOR UPDATE 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Superuser can manage all profiles" ON profiles;
CREATE POLICY "Superuser can manage all profiles" ON profiles
  FOR ALL 
  USING (public.is_superuser())
  WITH CHECK (public.is_superuser());


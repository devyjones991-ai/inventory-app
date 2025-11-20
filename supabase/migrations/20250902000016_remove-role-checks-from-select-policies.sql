-- РАДИКАЛЬНОЕ РЕШЕНИЕ: Убираем все проверки роли из SELECT политик
-- Используем только простые проверки и RPC функцию для загрузки списка

-- Удаляем ВСЕ политики SELECT, которые проверяют роль
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Superuser can view all profiles" ON profiles;

-- Оставляем только простую политику для просмотра своего профиля
-- (она уже должна существовать, но убедимся)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- ВАЖНО: Для загрузки списка всех пользователей используем ТОЛЬКО RPC функцию get_all_profiles()
-- Эта функция использует SECURITY DEFINER и полностью обходит RLS
-- Политики SELECT больше НЕ проверяют роль - это предотвращает рекурсию

-- Политики для UPDATE и DELETE оставляем (они не вызывают рекурсию при SELECT)
-- Но убедимся, что они используют функции, а не SELECT

-- Обновляем политику для обновления профиля
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = public.get_user_role_cached() -- Используем функцию
  );

-- Политики для admin и superuser для UPDATE/DELETE
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
CREATE POLICY "Admins can update all profiles" ON profiles
  FOR UPDATE 
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Superuser can manage all profiles" ON profiles;
CREATE POLICY "Superuser can manage all profiles" ON profiles
  FOR ALL 
  USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles" ON profiles
  FOR DELETE USING (
    public.is_admin()
    AND id != auth.uid()
  );


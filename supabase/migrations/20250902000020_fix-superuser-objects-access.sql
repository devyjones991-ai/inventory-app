-- Исправление доступа superuser к объектам
-- Проблема: is_superuser() может вызывать ошибку "permission denied for table users"
-- Решение: убеждаемся, что функция работает правильно и не обращается к auth.users

-- Проверяем и обновляем функцию get_user_role_cached, чтобы она точно не обращалась к auth.users
CREATE OR REPLACE FUNCTION public.get_user_role_cached(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Получаем роль напрямую из profiles с SECURITY DEFINER (обходит RLS)
  -- НЕ обращаемся к auth.users, чтобы избежать ошибок прав доступа
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Если роль не найдена, возвращаем NULL
  RETURN COALESCE(user_role, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Обновляем is_superuser для использования обновленной функции
CREATE OR REPLACE FUNCTION public.is_superuser(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  -- Используем функцию, которая обходит RLS и не обращается к auth.users
  RETURN public.get_user_role_cached(user_id) = 'superuser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Убеждаемся, что политики для profiles позволяют superuser видеть все профили
-- Обновляем политику SELECT для profiles
DROP POLICY IF EXISTS "Superusers can view all profiles" ON profiles;
CREATE POLICY "Superusers can view all profiles" ON profiles
  FOR SELECT USING (public.is_superuser());

-- Обновляем политику UPDATE для profiles
DROP POLICY IF EXISTS "Superusers can update all profiles" ON profiles;
CREATE POLICY "Superusers can update all profiles" ON profiles
  FOR UPDATE USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- Комментарии
COMMENT ON FUNCTION public.get_user_role_cached(UUID) IS 
'Возвращает роль пользователя из profiles. Использует SECURITY DEFINER для обхода RLS. НЕ обращается к auth.users.';

COMMENT ON FUNCTION public.is_superuser(UUID) IS 
'Проверяет, является ли пользователь superuser. Использует get_user_role_cached, которая не обращается к auth.users.';

COMMENT ON POLICY "Superusers can view all profiles" ON profiles IS 
'Позволяет superuser видеть все профили. Использует функцию is_superuser().';

COMMENT ON POLICY "Superusers can update all profiles" ON profiles IS 
'Позволяет superuser обновлять все профили. Использует функцию is_superuser().';


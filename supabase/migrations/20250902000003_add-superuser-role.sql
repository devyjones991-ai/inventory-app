-- Добавление роли superuser и политик для обхода RLS

-- 1. Обновляем CHECK constraint для роли, добавляя 'superuser'
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('user', 'admin', 'superuser'));

-- 2. Функция для проверки, является ли пользователь superuser
CREATE OR REPLACE FUNCTION public.is_superuser(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'superuser'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Функция для назначения superuser (только для существующих superuser)
CREATE OR REPLACE FUNCTION public.grant_superuser(target_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Проверяем, что текущий пользователь - superuser
  IF NOT public.is_superuser() THEN
    RAISE EXCEPTION 'Только superuser может назначать других superuser';
  END IF;

  -- Находим пользователя по email
  SELECT id INTO target_user_id 
  FROM auth.users 
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Пользователь с email % не найден', target_email;
  END IF;

  -- Обновляем роль
  UPDATE public.profiles 
  SET role = 'superuser', updated_at = NOW()
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Обновляем политики для objects - superuser может всё
DROP POLICY IF EXISTS "Superuser can manage all objects" ON public.objects;
CREATE POLICY "Superuser can manage all objects" ON public.objects
  FOR ALL USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- 5. Обновляем политики для object_members - superuser может управлять всеми
DROP POLICY IF EXISTS "Superuser can manage all object_members" ON public.object_members;
CREATE POLICY "Superuser can manage all object_members" ON public.object_members
  FOR ALL USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- 6. Обновляем политики для tasks - superuser может всё
DROP POLICY IF EXISTS "Superuser can manage all tasks" ON public.tasks;
CREATE POLICY "Superuser can manage all tasks" ON public.tasks
  FOR ALL USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- 7. Обновляем политики для hardware - superuser может всё
DROP POLICY IF EXISTS "Superuser can manage all hardware" ON public.hardware;
CREATE POLICY "Superuser can manage all hardware" ON public.hardware
  FOR ALL USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- 8. Обновляем политики для chat_messages - superuser может всё
DROP POLICY IF EXISTS "Superuser can manage all chat_messages" ON public.chat_messages;
CREATE POLICY "Superuser can manage all chat_messages" ON public.chat_messages
  FOR ALL USING (public.is_superuser())
  WITH CHECK (public.is_superuser());

-- 9. Обновляем политики для profiles - superuser может всё
DROP POLICY IF EXISTS "Superuser can manage all profiles" ON public.profiles;
CREATE POLICY "Superuser can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_superuser())
  WITH CHECK (public.is_superuser());


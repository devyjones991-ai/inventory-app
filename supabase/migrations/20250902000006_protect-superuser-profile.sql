-- Защита профиля superuser от удаления и изменения роли

-- Обновляем политику удаления профилей
-- Администраторы не могут удалять профили superuser
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) 
    AND id != auth.uid()
    -- Защита: нельзя удалить superuser
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profiles.id AND p.role = 'superuser'
    )
  );

-- Superuser может удалять всех кроме других superuser
DROP POLICY IF EXISTS "Superuser can delete profiles" ON public.profiles;
CREATE POLICY "Superuser can delete profiles" ON public.profiles
  FOR DELETE USING (
    public.is_superuser()
    AND id != auth.uid()
    -- Superuser не может удалить другого superuser
    AND NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profiles.id AND p.role = 'superuser'
    )
  );

-- Обновляем политику обновления профилей
-- Администраторы не могут изменять роль superuser
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    -- Защита: нельзя изменить роль superuser на другую
    AND (
      -- Если редактируемый пользователь был superuser, он должен остаться superuser
      (SELECT role FROM public.profiles WHERE id = profiles.id) != 'superuser'
      OR role = 'superuser'
    )
  );

-- Superuser может изменять роли всех, кроме других superuser
-- (это уже покрыто политикой "Superuser can manage all profiles", но добавим явную проверку)
-- Политика уже существует в миграции 20250902000003_add-superuser-role.sql


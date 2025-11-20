-- Удаление всех обращений к auth.users из политик RLS
-- Проблема: некоторые политики все еще используют SELECT FROM auth.users, что вызывает ошибку "permission denied for table users"
-- Решение: удаляем все такие политики и пересоздаем их без обращений к auth.users

-- 1. Удаляем все старые политики для objects, которые могут использовать auth.users
DROP POLICY IF EXISTS "Users can view their own objects" ON objects;
DROP POLICY IF EXISTS "Users can update their own objects" ON objects;
DROP POLICY IF EXISTS "Users can delete their own objects" ON objects;
DROP POLICY IF EXISTS "Users can create their own objects" ON objects;
DROP POLICY IF EXISTS "Members manage objects" ON objects;
DROP POLICY IF EXISTS "Members can update objects" ON objects;
DROP POLICY IF EXISTS "Members can delete objects" ON objects;
DROP POLICY IF EXISTS "Members can select objects" ON objects;

-- 2. Создаем правильные политики БЕЗ обращений к auth.users
-- Политика SELECT
CREATE POLICY "Members can select objects" ON objects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );

-- Политика UPDATE
CREATE POLICY "Members can update objects" ON objects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );

-- Политика DELETE
CREATE POLICY "Members can delete objects" ON objects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );

-- Политика INSERT (уже должна быть, но пересоздаем для уверенности)
DROP POLICY IF EXISTS "Authenticated insert objects" ON objects;
CREATE POLICY "Authenticated insert objects" ON objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Убеждаемся, что функция is_superuser() не обращается к auth.users
-- Пересоздаем функцию get_user_role_cached для гарантии
CREATE OR REPLACE FUNCTION public.get_user_role_cached(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Получаем роль ТОЛЬКО из profiles, НЕ из auth.users
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  
  -- Если роль не найдена, возвращаем NULL (не 'user', чтобы избежать проблем)
  RETURN COALESCE(user_role, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Пересоздаем is_superuser для гарантии
CREATE OR REPLACE FUNCTION public.is_superuser(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Используем get_user_role_cached, которая НЕ обращается к auth.users
  user_role := public.get_user_role_cached(user_id);
  RETURN user_role = 'superuser';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Проверяем, что триггер для автоматического добавления в object_members работает
-- (он уже должен быть создан в миграции 20250902000001_auto-add-creator-to-object-members.sql)
-- Но убеждаемся, что функция существует
CREATE OR REPLACE FUNCTION public.handle_new_object()
RETURNS TRIGGER AS $$
BEGIN
  -- Автоматически добавляем создателя объекта в object_members
  INSERT INTO public.object_members (object_id, user_id)
  VALUES (NEW.id, auth.uid())
  ON CONFLICT (object_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Убеждаемся, что триггер существует
DROP TRIGGER IF EXISTS on_object_created ON public.objects;
CREATE TRIGGER on_object_created
  AFTER INSERT ON public.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_object();

-- Комментарии
COMMENT ON FUNCTION public.get_user_role_cached(UUID) IS 
'Возвращает роль пользователя из profiles. НЕ обращается к auth.users. Использует SECURITY DEFINER для обхода RLS.';

COMMENT ON FUNCTION public.is_superuser(UUID) IS 
'Проверяет, является ли пользователь superuser. НЕ обращается к auth.users. Использует get_user_role_cached.';

COMMENT ON POLICY "Members can select objects" ON objects IS 
'Позволяет видеть объекты членам объекта или superuser. НЕ использует auth.users.';

COMMENT ON POLICY "Members can update objects" ON objects IS 
'Позволяет обновлять объекты членам объекта или superuser. НЕ использует auth.users.';

COMMENT ON POLICY "Members can delete objects" ON objects IS 
'Позволяет удалять объекты членам объекта или superuser. НЕ использует auth.users.';


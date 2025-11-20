-- Полное исправление RLS политик для объектов
-- Проблема: политика "Members manage objects" использует FOR ALL, что может конфликтовать
-- Решение: удаляем общую политику и создаем отдельные политики для SELECT, UPDATE, DELETE

-- Удаляем старую общую политику
DROP POLICY IF EXISTS "Members manage objects" ON objects;

-- Политика SELECT: пользователи могут видеть объекты, в которых они являются членами
CREATE POLICY "Members can select objects" ON objects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );

-- Политика UPDATE: пользователи могут обновлять объекты, в которых они являются членами
DROP POLICY IF EXISTS "Members can update objects" ON objects;
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

-- Политика DELETE: пользователи могут удалять объекты, в которых они являются членами
DROP POLICY IF EXISTS "Members can delete objects" ON objects;
CREATE POLICY "Members can delete objects" ON objects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );

-- Политика INSERT уже есть: "Authenticated insert objects"
-- Проверяем, что она существует, если нет - создаем
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated insert objects'
  ) THEN
    CREATE POLICY "Authenticated insert objects" ON objects
      FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
END $$;

-- Комментарии к политикам
COMMENT ON POLICY "Members can select objects" ON objects IS 
'Позволяет видеть объекты членам объекта или superuser';

COMMENT ON POLICY "Members can update objects" ON objects IS 
'Позволяет обновлять объекты членам объекта или superuser. Создатель автоматически добавляется в object_members через триггер.';

COMMENT ON POLICY "Members can delete objects" ON objects IS 
'Позволяет удалять объекты членам объекта или superuser';


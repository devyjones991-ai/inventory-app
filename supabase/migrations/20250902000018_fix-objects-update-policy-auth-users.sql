-- Исправление политики обновления объектов: убираем проверку через auth.users
-- Проблема: SELECT email FROM auth.users требует прав, которых нет у обычных пользователей
-- Решение: убираем эту проверку, так как у нас уже есть проверка через object_members и is_superuser()

-- Удаляем старую политику
DROP POLICY IF EXISTS "Members can update objects" ON objects;

-- Создаем новую политику без проверки через auth.users
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

-- Также обновляем политику удаления для консистентности
DROP POLICY IF EXISTS "Members can delete objects" ON objects;

CREATE POLICY "Members can delete objects" ON objects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );

-- Комментарий к миграции
COMMENT ON POLICY "Members can update objects" ON objects IS 
'Позволяет обновлять объекты членам объекта или superuser. Не использует auth.users для избежания проблем с правами доступа.';


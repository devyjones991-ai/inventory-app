-- Исправление RLS политик для objects
-- Проблема: политика "Members manage objects" с FOR ALL блокирует INSERT
-- Решение: разделить политики по операциям

-- Удаляем старую политику
DROP POLICY IF EXISTS "Members manage objects" ON public.objects;

-- Создаем отдельные политики для каждой операции
-- SELECT: только члены могут читать объекты
CREATE POLICY "Members can read objects" ON public.objects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
  );

-- UPDATE: только члены могут обновлять объекты
CREATE POLICY "Members can update objects" ON public.objects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
  );

-- DELETE: только члены могут удалять объекты
CREATE POLICY "Members can delete objects" ON public.objects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
  );

-- INSERT: любой аутентифицированный пользователь может создавать объекты
-- (триггер автоматически добавит создателя в object_members)
-- Политика "Authenticated insert objects" уже существует, но убедимся что она правильная
DROP POLICY IF EXISTS "Authenticated insert objects" ON public.objects;
CREATE POLICY "Authenticated insert objects" ON public.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');


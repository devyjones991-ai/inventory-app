-- Улучшение политик для просмотра всех профилей superuser и admin
-- Убеждаемся, что superuser может видеть всех пользователей

-- Политика для superuser (должна быть первой для приоритета)
DROP POLICY IF EXISTS "Superuser can view all profiles" ON profiles;
CREATE POLICY "Superuser can view all profiles" ON profiles
  FOR SELECT USING (public.is_superuser());

-- Обновляем политику для admin, чтобы она также работала
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
  );

-- Политика "Superuser can manage all profiles" уже существует и покрывает все операции
-- Но для SELECT лучше иметь отдельную политику для ясности


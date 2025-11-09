-- Колонка role уже создана в миграции 20241201_create_profiles_table.sql
-- Добавляем только политики для tasks

-- Для INSERT политики нужно использовать WITH CHECK, а не USING
CREATE POLICY "Admins can insert tasks" ON tasks 
  FOR INSERT 
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Для UPDATE: assignee - это text (email или имя), поэтому сравниваем с email из profiles
-- или проверяем по user_id, если он совпадает с текущим пользователем
CREATE POLICY "Users can update own tasks" ON tasks 
  FOR UPDATE 
  USING (
    user_id = auth.uid() 
    OR assignee = (SELECT email FROM profiles WHERE id = auth.uid())
  );

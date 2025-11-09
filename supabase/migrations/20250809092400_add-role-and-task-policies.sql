-- Колонка role уже создана в миграции 20241201_create_profiles_table.sql
-- Добавляем только политики для tasks

CREATE POLICY "Admins can insert tasks" ON tasks FOR INSERT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (assignee = auth.uid());

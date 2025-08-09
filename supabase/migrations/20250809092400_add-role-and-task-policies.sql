ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
CREATE POLICY "Admins can insert tasks" ON tasks FOR INSERT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (assignee = auth.uid());

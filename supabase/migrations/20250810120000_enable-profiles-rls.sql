-- Enable RLS and add policies for profiles table
-- RLS уже включен в миграции 20241201_create_profiles_table.sql
-- alter table profiles enable row level security;

-- Политика "Users can select own profile" уже создана в 20241201_create_profiles_table.sql как "Users can view own profile"
-- Политика "Users can update own profile" уже создана в 20241201_create_profiles_table.sql

-- Обновляем политику для обновления профиля, чтобы запретить изменение роли
-- Сначала удаляем старую политику, если она существует
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Создаем обновленную политику, которая запрещает изменение роли
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Allow admins to update role
CREATE POLICY "Admins can update role" ON profiles
  FOR UPDATE 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Fix profiles view policy to ensure users can always read their own profile
-- This is critical for role checking in ProfileSettings

-- Drop and recreate "Users can view own profile" policy to ensure it works
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR is_superuser() -- Superuser can view any profile
  );

-- Ensure "Admins can view all profiles" also includes superuser bypass
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'superuser')
    )
    OR is_superuser() -- Superuser can view any profile
  );


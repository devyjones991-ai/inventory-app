-- Fix RLS policies for objects to avoid accessing auth.users directly

-- Drop existing policies
DROP POLICY IF EXISTS "Members can update objects" ON objects;
DROP POLICY IF EXISTS "Members can delete objects" ON objects;

-- Recreate policies using auth.jwt() ->> 'email'

-- 4.3. Members can update objects
CREATE POLICY "Members can update objects" ON objects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR objects.user_email = (auth.jwt() ->> 'email')
    OR public.is_superuser()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR objects.user_email = (auth.jwt() ->> 'email')
    OR public.is_superuser()
  );

-- 4.4. Members can delete objects
CREATE POLICY "Members can delete objects" ON objects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR objects.user_email = (auth.jwt() ->> 'email')
    OR public.is_superuser()
  );

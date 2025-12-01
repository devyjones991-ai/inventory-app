-- Fix RLS policies for hardware to allow members to manage it

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Members can manage hardware" ON hardware;
DROP POLICY IF EXISTS "Members can update hardware" ON hardware;
DROP POLICY IF EXISTS "Members can delete hardware" ON hardware;

-- Allow members to UPDATE hardware
CREATE POLICY "Members can update hardware" ON hardware
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = hardware.object_id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );

-- Allow members to DELETE hardware
CREATE POLICY "Members can delete hardware" ON hardware
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = hardware.object_id AND om.user_id = auth.uid()
    )
    OR public.is_superuser()
  );

-- Ensure objects deletion is allowed for members (fix for "object not deleted")
DROP POLICY IF EXISTS "Members can delete objects" ON objects;
CREATE POLICY "Members can delete objects" ON objects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = objects.id AND om.user_id = auth.uid()
    )
    OR objects.user_email = (auth.jwt() ->> 'email')
    OR public.is_superuser()
  );

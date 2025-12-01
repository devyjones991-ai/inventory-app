-- Fix RLS policies for hardware to allow object owners to manage it

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Members can update hardware" ON hardware;
DROP POLICY IF EXISTS "Members can delete hardware" ON hardware;

-- Allow members AND object owners to UPDATE hardware
CREATE POLICY "Members and owners can update hardware" ON hardware
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = hardware.object_id AND om.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM objects o
      WHERE o.id = hardware.object_id AND o.user_email = (auth.jwt() ->> 'email')
    )
    OR public.is_superuser()
  );

-- Allow members AND object owners to DELETE hardware
CREATE POLICY "Members and owners can delete hardware" ON hardware
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM object_members om
      WHERE om.object_id = hardware.object_id AND om.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM objects o
      WHERE o.id = hardware.object_id AND o.user_email = (auth.jwt() ->> 'email')
    )
    OR public.is_superuser()
  );

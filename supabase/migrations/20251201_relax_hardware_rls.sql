-- Relax RLS policies for hardware table to allow all authenticated users to manage it
-- This is a temporary measure as requested by the user

BEGIN;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Members can view hardware" ON hardware;
DROP POLICY IF EXISTS "Members can insert hardware" ON hardware;
DROP POLICY IF EXISTS "Members can update hardware" ON hardware;
DROP POLICY IF EXISTS "Members can delete hardware" ON hardware;
DROP POLICY IF EXISTS "Owners can update hardware" ON hardware;
DROP POLICY IF EXISTS "Owners can delete hardware" ON hardware;

-- Create permissive policies for authenticated users
CREATE POLICY "Authenticated users can view hardware"
ON hardware FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert hardware"
ON hardware FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update hardware"
ON hardware FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete hardware"
ON hardware FOR DELETE
TO authenticated
USING (true);

COMMIT;

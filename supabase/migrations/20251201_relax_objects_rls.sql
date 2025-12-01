-- Relax RLS policies for objects table to allow all authenticated users to manage them
-- This is a temporary measure as requested by the user
BEGIN;
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their objects" ON objects;
DROP POLICY IF EXISTS "Users can insert objects" ON objects;
DROP POLICY IF EXISTS "Users can update their objects" ON objects;
DROP POLICY IF EXISTS "Users can delete their objects" ON objects;
DROP POLICY IF EXISTS "Members can view objects" ON objects;
DROP POLICY IF EXISTS "Members can update objects" ON objects;
DROP POLICY IF EXISTS "Members can delete objects" ON objects;
-- Create permissive policies for authenticated users
CREATE POLICY "Authenticated users can view objects" ON objects FOR
SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert objects" ON objects FOR
INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update objects" ON objects FOR
UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete objects" ON objects FOR DELETE TO authenticated USING (true);
COMMIT;
-- Fix foreign key constraint for object_members to allow cascading deletes

-- Drop existing constraint
ALTER TABLE object_members
DROP CONSTRAINT IF EXISTS object_members_object_id_fkey;

-- Add new constraint with ON DELETE CASCADE
ALTER TABLE object_members
ADD CONSTRAINT object_members_object_id_fkey
FOREIGN KEY (object_id)
REFERENCES objects(id)
ON DELETE CASCADE;

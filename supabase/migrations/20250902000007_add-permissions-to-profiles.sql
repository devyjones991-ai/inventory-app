-- Add permissions column to profiles table
-- Permissions will be stored as JSONB array of permission IDs

-- 1. Add permissions column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='permissions') THEN
        ALTER TABLE public.profiles ADD COLUMN permissions JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Column "permissions" added to "profiles" table.';
    ELSE
        RAISE NOTICE 'Column "permissions" already exists in "profiles" table, skipping.';
    END IF;
END
$$;

-- 2. Create index for faster permission queries
CREATE INDEX IF NOT EXISTS idx_profiles_permissions ON profiles USING GIN (permissions);

-- 3. Add comment to explain the column
COMMENT ON COLUMN profiles.permissions IS 'Array of permission IDs granted to the user. Example: ["manage_objects", "manage_tasks"]';


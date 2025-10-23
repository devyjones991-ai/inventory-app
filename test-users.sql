-- Test script to check and create users
-- Check if profiles table exists and has data
SELECT COUNT(*) as user_count FROM profiles;

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Insert test user if not exists
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  'Test User',
  'user'
) ON CONFLICT (id) DO NOTHING;

-- Check all users
SELECT id, email, full_name, role, created_at FROM profiles ORDER BY created_at;

-- Add username field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Add index for username for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username) WHERE username IS NOT NULL;

-- Add constraint for username format (alphanumeric, underscore, dash, 3-20 chars)
ALTER TABLE public.profiles 
ADD CONSTRAINT username_format 
CHECK (username IS NULL OR username ~* '^[a-zA-Z0-9_-]{3,20}$');

-- Update existing profiles to have username based on email prefix
UPDATE public.profiles 
SET username = LOWER(SPLIT_PART(email, '@', 1))
WHERE username IS NULL AND email IS NOT NULL;

-- Add unique constraint for username
ALTER TABLE public.profiles 
ADD CONSTRAINT unique_username UNIQUE (username);



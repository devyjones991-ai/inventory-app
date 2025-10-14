-- Extend profiles table with additional user fields
alter table public.profiles 
add column if not exists backup_email text,
add column if not exists phone text,
add column if not exists preferences jsonb default '{}',
add column if not exists updated_at timestamp with time zone default now();

-- Add constraint for backup_email format
alter table public.profiles 
add constraint backup_email_format 
check (backup_email is null or backup_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add constraint for phone format (basic international format)
alter table public.profiles 
add constraint phone_format 
check (phone is null or phone ~* '^\+?[1-9]\d{1,14}$');

-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger to automatically update updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

-- Add index for backup_email for faster lookups
create index if not exists idx_profiles_backup_email on public.profiles(backup_email) where backup_email is not null;

-- Add index for phone for faster lookups
create index if not exists idx_profiles_phone on public.profiles(phone) where phone is not null;

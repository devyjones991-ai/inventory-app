-- Enable RLS and add policies for profiles table
alter table profiles enable row level security;

-- Allow users to select their own profile
create policy "Users can select own profile" on profiles
  for select using (id = auth.uid());

-- Allow users to update their own profile without changing role
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));

-- Allow admins to update role
create policy "Admins can update role" on profiles
  for update using (auth.role() = 'admin')
  with check (auth.role() = 'admin');

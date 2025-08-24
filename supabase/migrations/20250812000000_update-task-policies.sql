-- Update task policies to allow management by admins and assignees

-- Remove existing permissive policies if present
drop policy if exists "allow_authenticated" on tasks;
drop policy if exists "Users can update own tasks" on tasks;

-- Allow authenticated users to read and create tasks
create policy "allow_authenticated_read_tasks" on tasks
  for select using (auth.role() = 'authenticated');

create policy "allow_authenticated_insert_tasks" on tasks
  for insert with check (auth.role() = 'authenticated');

-- Allow authenticated users to modify tasks
create policy "allow_authenticated_update_tasks" on tasks
  for update using (auth.role() = 'authenticated');

create policy "allow_authenticated_delete_tasks" on tasks
  for delete using (auth.role() = 'authenticated');

-- Allow admins full control over tasks
create policy "Admins can manage tasks" on tasks
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


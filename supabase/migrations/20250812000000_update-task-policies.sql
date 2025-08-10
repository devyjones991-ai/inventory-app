-- Update task policies to allow management by admins and assignees

-- Remove existing permissive policies if present
drop policy if exists "allow_authenticated" on tasks;
drop policy if exists "Users can update own tasks" on tasks;

-- Allow authenticated users to read and create tasks
create policy "allow_authenticated_read_tasks" on tasks
  for select using (auth.role() = 'authenticated');

create policy "allow_authenticated_insert_tasks" on tasks
  for insert with check (auth.role() = 'authenticated');

-- Allow users to modify only tasks assigned to them
create policy "Users can update own tasks" on tasks
  for update using (assignee_id = auth.uid());

create policy "Users can delete own tasks" on tasks
  for delete using (assignee_id = auth.uid());

-- Allow admins full control over tasks
create policy "Admins can manage tasks" on tasks
  for all using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );


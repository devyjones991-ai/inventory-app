drop policy if exists "Users can update own tasks" on tasks;
drop policy if exists "Users can delete own tasks" on tasks;
drop policy if exists "Admins can manage tasks" on tasks;

create policy "Authenticated users manage tasks" on tasks
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

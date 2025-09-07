-- Restrict access to tables by object_id and membership

-- Table mapping users to objects
create table if not exists public.object_members (
  object_id uuid references objects(id),
  user_id uuid references auth.users(id),
  inserted_at timestamptz not null default now(),
  primary key (object_id, user_id)
);

alter table object_members enable row level security;
create policy "Users manage own memberships" on object_members
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Objects
alter table objects enable row level security;
drop policy if exists "allow_authenticated" on objects;
create policy "Members manage objects" on objects
  for all using (
    exists (
      select 1 from object_members om
      where om.object_id = objects.id and om.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from object_members om
      where om.object_id = objects.id and om.user_id = auth.uid()
    )
  );
create policy "Authenticated insert objects" on objects
  for insert with check (auth.role() = 'authenticated');

-- Hardware
alter table hardware enable row level security;
drop policy if exists "allow_authenticated" on hardware;
create policy "Members manage hardware" on hardware
  for all using (
    exists (
      select 1 from object_members om
      where om.object_id = hardware.object_id and om.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from object_members om
      where om.object_id = hardware.object_id and om.user_id = auth.uid()
    )
  );

-- Tasks
alter table tasks enable row level security;
drop policy if exists "allow_authenticated_read_tasks" on tasks;
drop policy if exists "allow_authenticated_insert_tasks" on tasks;
drop policy if exists "allow_authenticated_update_tasks" on tasks;
drop policy if exists "allow_authenticated_delete_tasks" on tasks;
drop policy if exists "Authenticated users manage tasks" on tasks;
drop policy if exists "Admins can manage tasks" on tasks;
drop policy if exists "Admins can insert tasks" on tasks;
drop policy if exists "Users can update own tasks" on tasks;
create policy "Members manage tasks" on tasks
  for all using (
    exists (
      select 1 from object_members om
      where om.object_id = tasks.object_id and om.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from object_members om
      where om.object_id = tasks.object_id and om.user_id = auth.uid()
    )
  );

-- Chat messages
alter table chat_messages enable row level security;
drop policy if exists "allow_authenticated" on chat_messages;
create policy "Members manage chat messages" on chat_messages
  for all using (
    exists (
      select 1 from object_members om
      where om.object_id = chat_messages.object_id and om.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from object_members om
      where om.object_id = chat_messages.object_id and om.user_id = auth.uid()
    )
  );

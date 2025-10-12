-- Update row level security policies to enforce role permissions

-- Object members policies
alter table public.object_members enable row level security;

drop policy if exists "Users manage own memberships" on public.object_members;

drop policy if exists "Members view memberships" on public.object_members;
drop policy if exists "Admins manage memberships" on public.object_members;
drop policy if exists "Admins update memberships" on public.object_members;
drop policy if exists "Admins delete memberships" on public.object_members;

create policy "Members view memberships" on public.object_members
  for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = object_members.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_roles
    )
  );

create policy "Admins insert memberships" on public.object_members
  for insert
  with check (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = object_members.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_roles
    )
    and exists (
      select 1
      from public.object_roles r
      where r.object_id = object_members.object_id
        and r.role = object_members.role
    )
  );

create policy "Admins update memberships" on public.object_members
  for update
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = object_members.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_roles
    )
  )
  with check (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = object_members.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_roles
    )
    and exists (
      select 1
      from public.object_roles r
      where r.object_id = object_members.object_id
        and r.role = object_members.role
    )
  );

create policy "Admins delete memberships" on public.object_members
  for delete
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = object_members.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_roles
    )
  );

-- Objects policies
alter table public.objects enable row level security;

drop policy if exists "Members manage objects" on public.objects;
drop policy if exists "Object members can view" on public.objects;
drop policy if exists "Object managers update" on public.objects;
drop policy if exists "Object managers delete" on public.objects;

create policy "Object members can view" on public.objects
  for select
  using (
    exists (
      select 1
      from public.object_members om
      where om.object_id = objects.id
        and om.user_id = auth.uid()
    )
  );

create policy "Object managers update" on public.objects
  for update
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = objects.id
        and om.user_id = auth.uid()
        and oroles.can_manage_object
    )
  )
  with check (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = objects.id
        and om.user_id = auth.uid()
        and oroles.can_manage_object
    )
  );

create policy "Object managers delete" on public.objects
  for delete
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = objects.id
        and om.user_id = auth.uid()
        and oroles.can_manage_object
    )
  );

create policy "Authenticated insert objects" on public.objects
  for insert
  with check (auth.role() = 'authenticated');

-- Hardware policies
alter table public.hardware enable row level security;

drop policy if exists "Members manage hardware" on public.hardware;
drop policy if exists "Hardware viewers" on public.hardware;
drop policy if exists "Hardware managers insert" on public.hardware;
drop policy if exists "Hardware managers update" on public.hardware;
drop policy if exists "Hardware managers delete" on public.hardware;

create policy "Hardware viewers" on public.hardware
  for select
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = hardware.object_id
        and om.user_id = auth.uid()
        and oroles.can_view_hardware
    )
  );

create policy "Hardware managers insert" on public.hardware
  for insert
  with check (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = hardware.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_hardware
    )
  );

create policy "Hardware managers update" on public.hardware
  for update
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = hardware.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_hardware
    )
  )
  with check (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = hardware.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_hardware
    )
  );

create policy "Hardware managers delete" on public.hardware
  for delete
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = hardware.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_hardware
    )
  );

-- Tasks policies
alter table public.tasks enable row level security;

drop policy if exists "Members manage tasks" on public.tasks;
drop policy if exists "Task viewers" on public.tasks;
drop policy if exists "Task editors insert" on public.tasks;
drop policy if exists "Task editors update" on public.tasks;
drop policy if exists "Task editors delete" on public.tasks;

create policy "Task viewers" on public.tasks
  for select
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = tasks.object_id
        and om.user_id = auth.uid()
        and oroles.can_view_tasks
    )
  );

create policy "Task editors insert" on public.tasks
  for insert
  with check (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = tasks.object_id
        and om.user_id = auth.uid()
        and oroles.can_edit_tasks
    )
  );

create policy "Task editors update" on public.tasks
  for update
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = tasks.object_id
        and om.user_id = auth.uid()
        and oroles.can_edit_tasks
    )
  )
  with check (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = tasks.object_id
        and om.user_id = auth.uid()
        and oroles.can_edit_tasks
    )
  );

create policy "Task editors delete" on public.tasks
  for delete
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = tasks.object_id
        and om.user_id = auth.uid()
        and oroles.can_edit_tasks
    )
  );

-- Chat messages policies
alter table public.chat_messages enable row level security;

drop policy if exists "Members manage chat messages" on public.chat_messages;
drop policy if exists "Chat viewers" on public.chat_messages;
drop policy if exists "Chat participants insert" on public.chat_messages;
drop policy if exists "Chat participants update" on public.chat_messages;
drop policy if exists "Chat participants delete" on public.chat_messages;

create policy "Chat viewers" on public.chat_messages
  for select
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = chat_messages.object_id
        and om.user_id = auth.uid()
        and oroles.can_view_chat
    )
  );

create policy "Chat participants insert" on public.chat_messages
  for insert
  with check (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = chat_messages.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_chat
    )
  );

create policy "Chat participants update" on public.chat_messages
  for update
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = chat_messages.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_chat
    )
  )
  with check (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = chat_messages.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_chat
    )
  );

create policy "Chat participants delete" on public.chat_messages
  for delete
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = chat_messages.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_chat
    )
  );

-- Object roles policies
alter table public.object_roles enable row level security;

drop policy if exists "Role viewers" on public.object_roles;

drop policy if exists "Role managers" on public.object_roles;

create policy "Role viewers" on public.object_roles
  for select
  using (
    exists (
      select 1
      from public.object_members om
      where om.object_id = object_roles.object_id
        and om.user_id = auth.uid()
    )
  );

create policy "Role managers" on public.object_roles
  for all
  using (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = object_roles.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_roles
    )
  )
  with check (
    exists (
      select 1
      from public.object_members om
      join public.object_roles oroles
        on oroles.object_id = om.object_id
       and oroles.role = om.role
      where om.object_id = object_roles.object_id
        and om.user_id = auth.uid()
        and oroles.can_manage_roles
    )
  );

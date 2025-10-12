create table if not exists public.object_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  equipment_schema jsonb not null default '[]'::jsonb,
  is_public boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint object_templates_equipment_is_array
    check (jsonb_typeof(equipment_schema) = 'array')
);

create table if not exists public.task_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  task_schema jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint task_templates_schema_is_object
    check (jsonb_typeof(task_schema) = 'object')
);

create table if not exists public.template_tasks (
  object_template_id uuid not null references public.object_templates(id) on delete cascade,
  task_template_id uuid not null references public.task_templates(id) on delete cascade,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (object_template_id, task_template_id)
);

create index if not exists template_tasks_object_idx
  on public.template_tasks(object_template_id, position);
create index if not exists template_tasks_task_idx
  on public.template_tasks(task_template_id);

alter table public.object_templates enable row level security;
alter table public.task_templates enable row level security;
alter table public.template_tasks enable row level security;

create policy if not exists "View public or own object templates" on public.object_templates
  for select
  using (is_public or created_by = auth.uid());

create policy if not exists "Manage own object templates" on public.object_templates
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy if not exists "View related template tasks" on public.template_tasks
  for select
  using (
    exists (
      select 1
      from public.object_templates ot
      where ot.id = template_tasks.object_template_id
        and (ot.is_public or ot.created_by = auth.uid())
    )
  );

create policy if not exists "Manage template tasks for own templates" on public.template_tasks
  for all
  using (
    exists (
      select 1
      from public.object_templates ot
      where ot.id = template_tasks.object_template_id
        and ot.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.object_templates ot
      where ot.id = template_tasks.object_template_id
        and ot.created_by = auth.uid()
    )
  );

create policy if not exists "View public or own task templates" on public.task_templates
  for select
  using (is_public or created_by = auth.uid());

create policy if not exists "Manage own task templates" on public.task_templates
  for all
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

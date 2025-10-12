-- Add role-based access control for object members
create table if not exists public.object_roles (
  object_id uuid not null references public.objects(id) on delete cascade,
  role text not null,
  can_manage_object boolean not null default false,
  can_view_tasks boolean not null default true,
  can_edit_tasks boolean not null default false,
  can_view_hardware boolean not null default true,
  can_manage_hardware boolean not null default false,
  can_view_chat boolean not null default true,
  can_manage_chat boolean not null default false,
  can_manage_finances boolean not null default false,
  can_manage_roles boolean not null default false,
  primary key (object_id, role)
);

alter table public.object_members
  add column if not exists role text not null default 'viewer';

insert into public.object_roles (
  object_id,
  role,
  can_manage_object,
  can_view_tasks,
  can_edit_tasks,
  can_view_hardware,
  can_manage_hardware,
  can_view_chat,
  can_manage_chat,
  can_manage_finances,
  can_manage_roles
)
select
  o.id,
  r.role,
  r.can_manage_object,
  r.can_view_tasks,
  r.can_edit_tasks,
  r.can_view_hardware,
  r.can_manage_hardware,
  r.can_view_chat,
  r.can_manage_chat,
  r.can_manage_finances,
  r.can_manage_roles
from public.objects o
cross join (
  values
    (
      'admin',
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ),
    (
      'manager',
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      false
    ),
    (
      'viewer',
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      false,
      false
    )
) as r (
  role,
  can_manage_object,
  can_view_tasks,
  can_edit_tasks,
  can_view_hardware,
  can_manage_hardware,
  can_view_chat,
  can_manage_chat,
  can_manage_finances,
  can_manage_roles
)
on conflict (object_id, role) do nothing;

update public.object_members
set role = coalesce(role, 'viewer');

alter table public.object_members
  add constraint object_members_role_fk
    foreign key (object_id, role)
    references public.object_roles(object_id, role)
    on delete restrict;

create or replace function public.create_default_object_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.object_roles (
    object_id,
    role,
    can_manage_object,
    can_view_tasks,
    can_edit_tasks,
    can_view_hardware,
    can_manage_hardware,
    can_view_chat,
    can_manage_chat,
    can_manage_finances,
    can_manage_roles
  )
  values
    (
      new.id,
      'admin',
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ),
    (
      new.id,
      'manager',
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      false,
      false
    ),
    (
      new.id,
      'viewer',
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      false,
      false
    )
  on conflict (object_id, role) do update
    set
      can_manage_object = excluded.can_manage_object,
      can_view_tasks = excluded.can_view_tasks,
      can_edit_tasks = excluded.can_edit_tasks,
      can_view_hardware = excluded.can_view_hardware,
      can_manage_hardware = excluded.can_manage_hardware,
      can_view_chat = excluded.can_view_chat,
      can_manage_chat = excluded.can_manage_chat,
      can_manage_finances = excluded.can_manage_finances,
      can_manage_roles = excluded.can_manage_roles;
  return new;
end;
$$;

drop trigger if exists objects_create_default_roles on public.objects;
create trigger objects_create_default_roles
after insert on public.objects
for each row
execute function public.create_default_object_roles();

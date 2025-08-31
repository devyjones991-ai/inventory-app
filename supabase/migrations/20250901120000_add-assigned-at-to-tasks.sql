-- Add assigned_at column to tasks and keep it updated when assignee changes
alter table public.tasks
  add column if not exists assigned_at timestamptz;

create or replace function public.set_assigned_at_on_change()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.assignee is not null and new.assigned_at is null then
      new.assigned_at := now();
    end if;
    return new;
  elsif tg_op = 'UPDATE' then
    if (new.assignee is distinct from old.assignee) and new.assignee is not null then
      new.assigned_at := now();
    end if;
    return new;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_assigned_at on public.tasks;
create trigger trg_set_assigned_at
before insert or update on public.tasks
for each row execute function public.set_assigned_at_on_change();

create index if not exists tasks_assigned_at_idx on public.tasks(assigned_at);


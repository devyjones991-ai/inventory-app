-- Add Gantt-related scheduling fields to tasks
alter table public.tasks
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists duration integer,
  add column if not exists dependency_ids uuid[] default array[]::uuid[];

create or replace function public.ensure_task_gantt_fields()
returns trigger as $$
declare
  sanitized_deps uuid[];
  computed_duration integer;
  fallback_start date;
  fallback_end date;
begin
  sanitized_deps := coalesce(new.dependency_ids, array[]::uuid[]);
  sanitized_deps := array(
    select distinct dep
    from unnest(sanitized_deps) as dep
    where dep is not null
  );
  new.dependency_ids := sanitized_deps;

  if new.start_date is null then
    if new.due_date is not null then
      fallback_start := new.due_date;
    elsif new.end_date is not null and coalesce(new.duration, 0) > 0 then
      fallback_start := new.end_date - (new.duration - 1);
    else
      fallback_start := now()::date;
    end if;
    new.start_date := fallback_start;
  end if;

  if new.end_date is null then
    if new.start_date is not null and coalesce(new.duration, 0) > 0 then
      fallback_end := new.start_date + (coalesce(new.duration, 1) - 1);
    elsif new.due_date is not null then
      fallback_end := new.due_date;
    elsif new.start_date is not null then
      fallback_end := new.start_date;
    else
      fallback_end := now()::date;
    end if;
    new.end_date := fallback_end;
  end if;

  if new.start_date is not null and new.end_date is not null then
    if new.end_date < new.start_date then
      new.end_date := new.start_date;
    end if;
    computed_duration := greatest((new.end_date - new.start_date) + 1, 1);
    new.duration := computed_duration;
  else
    new.duration := greatest(coalesce(new.duration, 1), 1);
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_gantt_defaults on public.tasks;
create trigger trg_tasks_gantt_defaults
before insert or update on public.tasks
for each row execute function public.ensure_task_gantt_fields();

update public.tasks
set start_date = start_date;

alter table tasks
  add column if not exists assignee text;

-- migrate existing values from executor to assignee if the old column exists
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'tasks' and column_name = 'executor'
  ) then
    update tasks set assignee = executor where assignee is null;
  end if;
end $$;

-- drop legacy column
alter table tasks drop column if exists executor;

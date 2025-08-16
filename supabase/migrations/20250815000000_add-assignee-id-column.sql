alter table tasks
  add column if not exists assignee_id uuid;

-- migrate existing values from executor_id to assignee_id if the old column exists
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'tasks' and column_name = 'executor_id'
  ) then
    update tasks set assignee_id = executor_id where assignee_id is null;
  end if;
end $$;

-- drop legacy column
alter table tasks drop column if exists executor_id;

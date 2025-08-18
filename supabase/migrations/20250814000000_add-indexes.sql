create index tasks_object_id_idx on tasks(object_id);
create index tasks_assignee_idx on tasks(assignee);
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'tasks' and column_name = 'assignee_id'
  ) then
    create index if not exists tasks_assignee_id_idx on tasks(assignee_id);
  end if;
end $$;
create index tasks_created_at_idx on tasks(created_at);
create index hardware_object_id_idx on hardware(object_id);
create index hardware_created_at_idx on hardware(created_at);
create index chat_messages_object_id_idx on chat_messages(object_id);
create index chat_messages_created_at_idx on chat_messages(created_at);

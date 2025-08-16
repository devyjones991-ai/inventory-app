create index tasks_object_id_idx on tasks(object_id);
create index tasks_assignee_idx on tasks(assignee);
create index tasks_assignee_id_idx on tasks(assignee_id);
create index tasks_created_at_idx on tasks(created_at);
create index hardware_object_id_idx on hardware(object_id);
create index hardware_created_at_idx on hardware(created_at);
create index chat_messages_object_id_idx on chat_messages(object_id);
create index chat_messages_created_at_idx on chat_messages(created_at);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  target_table text not null,
  target_id uuid,
  meta jsonb,
  created_at timestamptz default now()
);

create or replace function log_audit_changes()
returns trigger as $$
declare
  v_action text;
  v_meta jsonb;
  v_target_id uuid;
begin
  if tg_op = 'INSERT' then
    v_action := 'insert';
    v_meta := to_jsonb(new);
    v_target_id := new.id;
    insert into audit_logs (user_id, action, target_table, target_id, meta)
    values (auth.uid(), v_action, tg_table_name, v_target_id, v_meta);
    return new;
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_meta := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
    v_target_id := new.id;
    insert into audit_logs (user_id, action, target_table, target_id, meta)
    values (auth.uid(), v_action, tg_table_name, v_target_id, v_meta);
    return new;
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
    v_meta := to_jsonb(old);
    v_target_id := old.id;
    insert into audit_logs (user_id, action, target_table, target_id, meta)
    values (auth.uid(), v_action, tg_table_name, v_target_id, v_meta);
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger trg_log_tasks
after insert or update or delete on tasks
for each row execute function log_audit_changes();

create trigger trg_log_objects
after insert or update or delete on objects
for each row execute function log_audit_changes();

create trigger trg_log_hardware
after insert or update or delete on hardware
for each row execute function log_audit_changes();

create trigger trg_log_chat_messages
after insert or update or delete on chat_messages
for each row execute function log_audit_changes();

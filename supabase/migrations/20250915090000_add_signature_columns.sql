alter table if exists tasks
  add column if not exists signed_by uuid,
  add column if not exists signed_at timestamptz,
  add column if not exists signature_hash text;

alter table if exists financial_transactions
  add column if not exists signed_by uuid,
  add column if not exists signed_at timestamptz,
  add column if not exists signature_hash text;

create or replace function log_audit_changes()
returns trigger as $$
declare
  v_action text;
  v_meta jsonb;
  v_target_id uuid;
  v_user uuid;
begin
  if tg_op = 'INSERT' then
    v_action := 'insert';
    v_meta := to_jsonb(new);
    v_target_id := new.id;
    v_user := coalesce(
      auth.uid(),
      new.signed_by,
      '00000000-0000-0000-0000-000000000000'::uuid
    );
    insert into audit_logs (user_id, action, target_table, target_id, meta)
    values (v_user, v_action, tg_table_name, v_target_id, v_meta);
    return new;
  elsif tg_op = 'UPDATE' then
    v_action := 'update';
    v_meta := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
    v_target_id := new.id;
    v_user := coalesce(
      auth.uid(),
      new.signed_by,
      old.signed_by,
      '00000000-0000-0000-0000-000000000000'::uuid
    );
    insert into audit_logs (user_id, action, target_table, target_id, meta)
    values (v_user, v_action, tg_table_name, v_target_id, v_meta);
    return new;
  elsif tg_op = 'DELETE' then
    v_action := 'delete';
    v_meta := to_jsonb(old);
    v_target_id := old.id;
    v_user := coalesce(
      auth.uid(),
      old.signed_by,
      '00000000-0000-0000-0000-000000000000'::uuid
    );
    insert into audit_logs (user_id, action, target_table, target_id, meta)
    values (v_user, v_action, tg_table_name, v_target_id, v_meta);
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

do $$
begin
  if to_regclass('public.financial_transactions') is not null then
    drop trigger if exists trg_log_financial_transactions on financial_transactions;
    create trigger trg_log_financial_transactions
      after insert or update or delete on financial_transactions
      for each row execute function log_audit_changes();
  end if;
end;
$$;

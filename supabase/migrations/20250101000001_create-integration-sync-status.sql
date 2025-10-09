create table if not exists integration_sync_status (
  integration text primary key,
  provider text,
  table_name text,
  schedule_cron text,
  schedule_frequency text,
  timezone text,
  column_mapping jsonb,
  details jsonb,
  last_run_at timestamptz,
  last_success_at timestamptz,
  status text,
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists integration_sync_status_status_idx
  on integration_sync_status (status);

create index if not exists integration_sync_status_last_success_idx
  on integration_sync_status (last_success_at desc);

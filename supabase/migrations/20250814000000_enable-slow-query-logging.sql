-- Enable logging of slow queries and prepare storage for analysis
-- ALTER SYSTEM требует прав суперпользователя, поэтому используем альтернативный подход
-- Для локального Supabase это не критично, можно настроить через config.toml или пропустить
-- ALTER SYSTEM SET log_min_duration_statement = 500;;

-- Ensure pg_stat_statements extension is available for query metrics
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Table to store collected slow query data
CREATE TABLE IF NOT EXISTS public.slow_query_logs (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  mean_time DOUBLE PRECISION NOT NULL,
  calls BIGINT NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

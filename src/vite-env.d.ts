/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // добавь другие переменные окружения здесь
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

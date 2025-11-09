// Runtime environment overrides for static hosting
// Локальная конфигурация Supabase
// Значения будут взяты из .env файла или установлены автоматически скриптом setup-local-supabase.sh
// Оставьте пустым для использования значений из .env или import.meta.env
window.__ENV = window.__ENV || {
  // Локальный Supabase будет настроен через .env файл
  // VITE_SUPABASE_URL будет установлен автоматически при запуске supabase start
  // VITE_SUPABASE_ANON_KEY будет установлен автоматически при запуске supabase start
};

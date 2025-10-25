// Runtime environment overrides for static hosting
// Fill in on the server if you need runtime-configurable env without rebuild
// Example:
//   window.__ENV = {
//     VITE_SUPABASE_URL: "https://project.supabase.co",
//     VITE_SUPABASE_ANON_KEY: "ey...",
//     VITE_API_BASE_URL: "https://your-api.example.com",
//   };
// Leave empty by default; values will fall back to import.meta.env / process.env
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: "https://ldbdqkbstlhugikalpin.supabase.co",
  VITE_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYmRxa2JzdGxodWdpa2FscGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3NzA4OTIsImV4cCI6MjA2OTM0Njg5Mn0.V9V20mwbCzfWYXn2HZGyjWRhFiu6TW0uw_s-WiiipTg",
  VITE_API_BASE_URL: "https://ldbdqkbstlhugikalpin.functions.supabase.co",
};

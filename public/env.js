// Runtime environment overrides for static hosting
// Локальный Supabase через nginx proxy
window.__ENV = window.__ENV || {
  VITE_SUPABASE_URL: "https://multiminder.duckdns.org",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  VITE_API_BASE_URL: "https://multiminder.duckdns.org",
};

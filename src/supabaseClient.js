import { createClient } from "@supabase/supabase-js";

import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from "./env";

const supabaseUrl = VITE_SUPABASE_URL;
const supabaseKey = VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Supabase client configuration for production
const supabaseOptions = {
  auth: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session from URL (for OAuth callbacks)
    detectSessionInUrl: true,
  },
  realtime: {
    // Enable realtime for production
    enabled: true,
    // Connection parameters
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    // Headers for all requests
    headers: {
      "X-Client-Info": "inventory-app",
    },
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, supabaseOptions)
  : null;

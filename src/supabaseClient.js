import { createClient } from "@supabase/supabase-js";
import logger from "./utils/logger";

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Используем только анонимный ключ; service_role в браузер не загружается
const supabaseKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from "./env";

const supabaseUrl = VITE_SUPABASE_URL;
const supabaseKey = VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey);

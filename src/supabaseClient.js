/* global process */
import { createClient } from "@supabase/supabase-js";
import logger from "./utils/logger";

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let supabase;

if (!isSupabaseConfigured) {
  logger.error("Не заданы VITE_SUPABASE_URL и/или VITE_SUPABASE_ANON_KEY.");
  const handler = {
    get() {
      return new Proxy(() => {
        logger.error("Попытка обращения к Supabase без конфигурации.");
        return Promise.reject(new Error("Supabase не сконфигурирован"));
      }, handler);
    },
    apply() {
      logger.error("Попытка обращения к Supabase без конфигурации.");
      return Promise.reject(new Error("Supabase не сконфигурирован"));
    },
  };
  supabase = new Proxy(() => {}, handler);
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

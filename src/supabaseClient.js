// @ts-check
/* global process */
import { createClient } from "@supabase/supabase-js";
import logger from "./utils/logger";

const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

/** @type {import('@supabase/supabase-js').SupabaseClient} */
let supabase;

if (!isSupabaseConfigured) {
  logger.error("VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are not set.");
  /** @type {ProxyHandler<any>} */
  const handler = {
    get() {
      return new Proxy(() => {
        logger.error("Supabase not available: invalid configuration.");
        return Promise.reject(new Error("Supabase is not configured"));
      }, handler);
    },
    apply() {
      logger.error("Supabase not available: invalid configuration.");
      return Promise.reject(new Error("Supabase is not configured"));
    },
  };
  supabase = /** @type {any} */ (new Proxy(() => {}, handler));
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

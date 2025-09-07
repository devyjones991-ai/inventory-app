/* global process */
import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const source = {
  VITE_API_BASE_URL:
    process.env.VITE_API_BASE_URL || import.meta.env?.VITE_API_BASE_URL,
  VITE_SUPABASE_URL:
    process.env.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY:
    process.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env?.VITE_SUPABASE_ANON_KEY,
};

const parsedEnv = envSchema.safeParse(source);

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      VITE_API_BASE_URL: undefined,
      VITE_SUPABASE_URL: undefined,
      VITE_SUPABASE_ANON_KEY: undefined,
    };

export const { VITE_API_BASE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } =
  env;

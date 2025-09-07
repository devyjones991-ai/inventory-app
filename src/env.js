/* global process */
import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsedEnv = envSchema.safeParse({
  VITE_API_BASE_URL:
    process.env.VITE_API_BASE_URL || import.meta.env?.VITE_API_BASE_URL,
  VITE_SUPABASE_URL:
    process.env.VITE_SUPABASE_URL || import.meta.env?.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY:
    process.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env?.VITE_SUPABASE_ANON_KEY,
});

if (!parsedEnv.success) {
  throw new Error(
    "Missing or invalid environment variables: " +
      JSON.stringify(parsedEnv.error.format()),
  );
}

export const env = parsedEnv.data;
export const { VITE_API_BASE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } =
  env;

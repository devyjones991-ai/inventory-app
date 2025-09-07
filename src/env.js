/* global process */
import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const getEnv = (key) => {
  if (typeof process !== "undefined" && process?.env?.[key])
    return process.env[key];
  return import.meta?.env?.[key];
};

const source = {
  VITE_API_BASE_URL: getEnv("VITE_API_BASE_URL"),
  VITE_SUPABASE_URL: getEnv("VITE_SUPABASE_URL"),
  VITE_SUPABASE_ANON_KEY: getEnv("VITE_SUPABASE_ANON_KEY"),
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

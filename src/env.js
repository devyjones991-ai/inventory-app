/* global process */
import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().optional(),
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const getEnv = (key) => {
  let v;
  if (typeof process !== "undefined" && process?.env?.[key])
    v = process.env[key];
  else v = import.meta?.env?.[key];
  return typeof v === "string" ? v.trim() : v;
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

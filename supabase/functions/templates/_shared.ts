import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return {
      errorResponse: new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);

  if (userError || !userData?.user) {
    return {
      errorResponse: new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }),
    };
  }

  return { supabase, user: userData.user };
}

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["1", "true", "yes"].includes(normalized);
  }
  return false;
}

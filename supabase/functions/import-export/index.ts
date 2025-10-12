import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

type JsonRecord = Record<string, unknown>;

type Actor = "user" | "cron";

const OK_HEADERS = { "Content-Type": "application/json" } as const;

function timingSafeEqual(a: string, b: string) {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i += 1) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

serve(async (req) => {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "status";

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const authHeader = req.headers.get("Authorization") || "";
  const cronSecretHeader = req.headers.get("x-cron-secret") || "";
  const cronSecretEnv = Deno.env.get("INTEGRATION_CRON_SECRET") || "";

  const supabase = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
  const service = createClient(supabaseUrl, serviceKey);

  let actor: Actor = "user";

  const cronAuthorized =
    cronSecretEnv &&
    cronSecretHeader &&
    timingSafeEqual(cronSecretHeader, cronSecretEnv);

  if (cronAuthorized) {
    actor = "cron";
  } else {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: OK_HEADERS,
      });
    }
    const metaRoles = Array.isArray(user.app_metadata?.roles)
      ? (user.app_metadata?.roles as string[])
      : [];
    const singleRole =
      typeof user.app_metadata?.role === "string"
        ? [user.app_metadata.role as string]
        : [];
    const profileRole =
      typeof user.user_metadata?.role === "string"
        ? [user.user_metadata.role as string]
        : [];
    const roles = [...metaRoles, ...singleRole, ...profileRole];
    if (!roles.includes("admin") && !roles.includes("manager")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: OK_HEADERS,
      });
    }
  }

  if (req.method === "GET" && action === "status") {
    const { data, error } = await service
      .from("integration_sync_status")
      .select("*")
      .order("integration", { ascending: true });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: OK_HEADERS,
      });
    }
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: OK_HEADERS,
    });
  }

  if (req.method === "PUT" && action === "schedule") {
    let payload: JsonRecord = {};
    try {
      payload = await req.json();
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON", details: err }),
        {
          status: 400,
          headers: OK_HEADERS,
        },
      );
    }

    const integration = String(payload.integration || "").trim();
    if (!integration) {
      return new Response(
        JSON.stringify({ error: "integration is required" }),
        {
          status: 400,
          headers: OK_HEADERS,
        },
      );
    }

    const now = new Date().toISOString();
    const scheduleEntry: JsonRecord = {
      integration,
      provider: payload.provider ?? null,
      table_name: payload.table ?? null,
      schedule_cron: payload.scheduleCron ?? null,
      schedule_frequency: payload.frequency ?? null,
      timezone: payload.timezone ?? null,
      column_mapping: payload.columnMapping ?? null,
      details: payload.details ?? null,
      updated_at: now,
    };

    const { error } = await service
      .from("integration_sync_status")
      .upsert(scheduleEntry, { onConflict: "integration" });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: OK_HEADERS,
      });
    }

    return new Response(JSON.stringify({ status: "saved", integration }), {
      status: 200,
      headers: OK_HEADERS,
    });
  }

  if (req.method === "POST" && action === "run") {
    let payload: JsonRecord = {};
    try {
      payload = await req.json();
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON", details: err }),
        {
          status: 400,
          headers: OK_HEADERS,
        },
      );
    }

    const integration = String(payload.integration || "").trim();
    if (!integration) {
      return new Response(
        JSON.stringify({ error: "integration is required" }),
        {
          status: 400,
          headers: OK_HEADERS,
        },
      );
    }

    const startedAt = new Date().toISOString();
    const { data: existingRow, error: fetchError } = await service
      .from("integration_sync_status")
      .select("*")
      .eq("integration", integration)
      .maybeSingle();
    if (fetchError) {
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: OK_HEADERS,
      });
    }

    const existingDetails = (existingRow?.details || {}) as JsonRecord;
    const runningDetails = {
      ...existingDetails,
      triggeredBy: actor,
      requestedAt: startedAt,
    } as JsonRecord;

    const { error: updateError } = await service
      .from("integration_sync_status")
      .upsert(
        {
          ...(existingRow ?? {}),
          integration,
          status: "running",
          last_run_at: startedAt,
          updated_at: startedAt,
          details: runningDetails,
        },
        { onConflict: "integration" },
      );
    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: OK_HEADERS,
      });
    }

    try {
      // Placeholder for actual sync execution (Cron or manual trigger)
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (err) {
      const failedAt = new Date().toISOString();
      await service.from("integration_sync_status").upsert(
        {
          ...(existingRow ?? {}),
          integration,
          status: "failed",
          updated_at: failedAt,
          details: {
            ...existingDetails,
            error: err instanceof Error ? err.message : String(err),
            failedAt,
          },
        },
        { onConflict: "integration" },
      );
      return new Response(
        JSON.stringify({
          error: err instanceof Error ? err.message : String(err),
        }),
        {
          status: 500,
          headers: OK_HEADERS,
        },
      );
    }

    const finishedAt = new Date().toISOString();
    const successDetails = {
      ...existingDetails,
      lastDirection:
        payload.direction ??
        (typeof existingDetails["lastDirection"] === "string"
          ? (existingDetails["lastDirection"] as string)
          : null),
      payload: payload.metadata ?? null,
      finishedAt,
      triggeredBy: actor,
    } as JsonRecord;

    const { error: successError } = await service
      .from("integration_sync_status")
      .upsert(
        {
          ...(existingRow ?? {}),
          integration,
          status: "success",
          last_run_at: startedAt,
          last_success_at: finishedAt,
          updated_at: finishedAt,
          details: successDetails,
        },
        { onConflict: "integration" },
      );
    if (successError) {
      return new Response(JSON.stringify({ error: successError.message }), {
        status: 500,
        headers: OK_HEADERS,
      });
    }

    return new Response(
      JSON.stringify({ status: "success", integration, finishedAt }),
      {
        status: 200,
        headers: OK_HEADERS,
      },
    );
  }

  return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
    status: 405,
    headers: OK_HEADERS,
  });
});

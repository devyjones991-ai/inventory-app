import { serve } from "std/server";
import { createClient } from "@supabase/supabase-js";

export interface ImportExportDependencies {
  createSupabaseClient?: (req: Request) => ReturnType<typeof createClient>;
}

const DEFAULT_DEPENDENCIES: Required<ImportExportDependencies> = {
  createSupabaseClient: (req: Request) =>
    createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization") || "",
          },
        },
      },
    ),
};

export async function handleRequest(
  req: Request,
  dependencies: ImportExportDependencies = {},
): Promise<Response> {
  const { createSupabaseClient } = {
    ...DEFAULT_DEPENDENCIES,
    ...dependencies,
  };

  const supabase = createSupabaseClient(req);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const role = user.app_metadata?.role || user.user_metadata?.role;
  if (!["admin", "manager"].includes(role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }
  return new Response(JSON.stringify({ message: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
}

if (import.meta.main) {
  serve((req) => handleRequest(req));
}

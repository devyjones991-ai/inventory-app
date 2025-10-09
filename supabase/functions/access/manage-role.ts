import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ManageRoleAction = "assign" | "remove";

interface ManageRolePayload {
  objectId?: string;
  memberId?: string;
  role?: string;
  action?: ManageRoleAction;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    ...init,
  });
}

async function getSessionUserId(
  req: Request,
  supabase: ReturnType<typeof createClient>,
) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

async function ensureManager(
  supabase: ReturnType<typeof createClient>,
  objectId: string,
  actorId: string,
) {
  const { data: membership, error } = await supabase
    .from("object_members")
    .select("role")
    .eq("object_id", objectId)
    .eq("user_id", actorId)
    .maybeSingle();
  if (error) throw error;
  if (!membership) return false;

  const { data: roleRecord, error: roleError } = await supabase
    .from("object_roles")
    .select("can_manage_roles")
    .eq("object_id", objectId)
    .eq("role", membership.role)
    .maybeSingle();
  if (roleError) throw roleError;
  return Boolean(roleRecord?.can_manage_roles);
}

async function assignRole(
  supabase: ReturnType<typeof createClient>,
  objectId: string,
  memberId: string,
  role: string,
) {
  const { data: roleExists, error: roleError } = await supabase
    .from("object_roles")
    .select("role")
    .eq("object_id", objectId)
    .eq("role", role)
    .maybeSingle();
  if (roleError) throw roleError;
  if (!roleExists) {
    return jsonResponse({ error: "Role not found" }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from("object_members")
    .upsert(
      { object_id: objectId, user_id: memberId, role },
      { onConflict: "object_id,user_id" },
    );
  if (upsertError) throw upsertError;
  return null;
}

async function removeMember(
  supabase: ReturnType<typeof createClient>,
  objectId: string,
  memberId: string,
) {
  const { error } = await supabase
    .from("object_members")
    .delete()
    .eq("object_id", objectId)
    .eq("user_id", memberId);
  if (error) throw error;
}

async function listMembers(
  supabase: ReturnType<typeof createClient>,
  objectId: string,
) {
  const { data, error } = await supabase
    .from("object_members")
    .select("user_id, role, profiles(full_name, avatar_url)")
    .eq("object_id", objectId)
    .order("inserted_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method Not Allowed" }, { status: 405 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Misconfigured Supabase" }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const actorId = await getSessionUserId(req, supabase);
  if (!actorId) {
    return jsonResponse({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: ManageRolePayload;
  try {
    payload = (await req.json()) as ManageRolePayload;
  } catch (error) {
    return jsonResponse(
      { error: "Invalid JSON", details: String(error) },
      { status: 400 },
    );
  }

  const objectId = payload.objectId?.trim();
  const memberId = payload.memberId?.trim();
  const role = payload.role?.trim();
  const action: ManageRoleAction = payload.action ?? "assign";

  if (!objectId || !memberId) {
    return jsonResponse(
      { error: "objectId and memberId are required" },
      { status: 400 },
    );
  }

  if (action === "assign" && !role) {
    return jsonResponse(
      { error: "role is required for assign action" },
      { status: 400 },
    );
  }

  try {
    const canManage = await ensureManager(supabase, objectId, actorId);
    if (!canManage) {
      return jsonResponse({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "assign") {
      const assignResult = await assignRole(
        supabase,
        objectId,
        memberId,
        role!,
      );
      if (assignResult) return assignResult;
    } else if (action === "remove") {
      await removeMember(supabase, objectId, memberId);
    } else {
      return jsonResponse({ error: "Unsupported action" }, { status: 400 });
    }

    const members = await listMembers(supabase, objectId);
    return jsonResponse({ success: true, members });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return jsonResponse({ error: message }, { status: 500 });
  }
}

serve(handler);

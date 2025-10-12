import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import { corsHeaders, jsonResponse, requireUser } from "../_shared.ts";

type EquipmentItem = {
  name?: string;
  location?: string | null;
  purchase_status?: string | null;
  install_status?: string | null;
};

type TaskSchema = {
  title?: string;
  status?: string | null;
  notes?: string | null;
  assignee?: string | null;
  due_date?: string | null;
};

const PURCHASE_ALLOWED = new Set(["not_paid", "paid", "unknown"]);
const INSTALL_ALLOWED = new Set(["not_installed", "installed", "unknown"]);
const TASK_ALLOWED = new Set(["planned", "in_progress", "done", "canceled"]);

function normalizeHardware(item: EquipmentItem, objectId: string) {
  const name = (item.name ?? "").trim();
  return {
    object_id: objectId,
    name: name || "Оборудование",
    location: item.location ?? null,
    purchase_status: PURCHASE_ALLOWED.has(
      String(item.purchase_status ?? "").trim(),
    )
      ? item.purchase_status
      : "unknown",
    install_status: INSTALL_ALLOWED.has(
      String(item.install_status ?? "").trim(),
    )
      ? item.install_status
      : "unknown",
  };
}

function normalizeTask(
  schema: TaskSchema | null | undefined,
  fallbackName: string,
  objectId: string,
) {
  const title = (schema?.title ?? fallbackName ?? "").trim() || "Задача";
  const status =
    schema?.status && TASK_ALLOWED.has(schema.status)
      ? schema.status
      : "planned";
  const dueDate = schema?.due_date ? String(schema.due_date) : null;
  const assignee = schema?.assignee ? String(schema.assignee).trim() : null;
  return {
    object_id: objectId,
    title,
    status,
    notes: schema?.notes ?? null,
    assignee,
    due_date: dueDate,
    assigned_at: assignee ? new Date().toISOString() : null,
  };
}

async function cleanupObject(supabase: any, objectId: string) {
  await supabase.from("hardware").delete().eq("object_id", objectId);
  await supabase.from("tasks").delete().eq("object_id", objectId);
  await supabase.from("object_members").delete().eq("object_id", objectId);
  await supabase.from("objects").delete().eq("id", objectId);
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400);
  }

  const templateId = String(body.templateId ?? "").trim();
  const name = String(body.name ?? "").trim();
  const overrideDescription =
    typeof body.description === "string" ? body.description.trim() : undefined;

  if (!templateId) {
    return jsonResponse({ error: "template_id_required" }, 400);
  }
  if (!name) {
    return jsonResponse({ error: "name_required" }, 400);
  }

  const auth = await requireUser(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { supabase, user } = auth;

  const { data: template, error: templateError } = await supabase
    .from("object_templates")
    .select(
      `id, name, description, equipment_schema, is_public, created_by,
       template_tasks(position, task_templates(id, name, description, task_schema))`,
    )
    .eq("id", templateId)
    .maybeSingle();

  if (templateError) {
    return jsonResponse({ error: templateError.message }, 500);
  }
  if (!template) {
    return jsonResponse({ error: "not_found" }, 404);
  }
  if (!template.is_public && template.created_by !== user.id) {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const description = overrideDescription ?? template.description ?? "";

  const { data: createdObject, error: objectError } = await supabase
    .from("objects")
    .insert([{ name, description }])
    .select("id, name, description, created_at")
    .single();

  if (objectError || !createdObject) {
    return jsonResponse(
      { error: objectError?.message ?? "failed_to_create" },
      500,
    );
  }

  const objectId = createdObject.id;

  const membershipResult = await supabase
    .from("object_members")
    .insert([{ object_id: objectId, user_id: user.id }]);

  if (membershipResult.error) {
    await cleanupObject(supabase, objectId);
    return jsonResponse({ error: membershipResult.error.message }, 500);
  }

  const equipment = Array.isArray(template.equipment_schema)
    ? template.equipment_schema.map((item) => normalizeHardware(item, objectId))
    : [];

  if (equipment.length) {
    const { error } = await supabase.from("hardware").insert(equipment);
    if (error) {
      await cleanupObject(supabase, objectId);
      return jsonResponse({ error: error.message }, 500);
    }
  }

  const tasksPayload = (template.template_tasks ?? [])
    .filter((item) => item?.task_templates)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((item) => {
      const task = item.task_templates!;
      return normalizeTask(task.task_schema, task.name, objectId);
    });

  if (tasksPayload.length) {
    const { error } = await supabase.from("tasks").insert(tasksPayload);
    if (error) {
      await cleanupObject(supabase, objectId);
      return jsonResponse({ error: error.message }, 500);
    }
  }

  return jsonResponse({ object: createdObject }, 201);
}

if (import.meta.main) {
  serve(handler);
}

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

import {
  corsHeaders,
  jsonResponse,
  parseBoolean,
  requireUser,
} from "../_shared.ts";

const TASK_ALLOWED = new Set(["planned", "in_progress", "done", "canceled"]);
const PURCHASE_ALLOWED = new Set(["not_paid", "paid", "unknown"]);
const INSTALL_ALLOWED = new Set(["not_installed", "installed", "unknown"]);

function sanitizeTask(task: any, index: number) {
  const title = String(task.title ?? "").trim() || `Задача ${index + 1}`;
  const status = TASK_ALLOWED.has(String(task.status ?? ""))
    ? task.status
    : "planned";
  const dueDate = task.due_date ? String(task.due_date) : null;
  return {
    name: title,
    description: task.notes ?? null,
    task_schema: {
      title,
      status,
      notes: task.notes ?? null,
      assignee: task.assignee ?? null,
      due_date: dueDate,
    },
  };
}

function sanitizeHardware(item: any) {
  const name = String(item.name ?? "").trim() || "Оборудование";
  const purchase = PURCHASE_ALLOWED.has(String(item.purchase_status ?? ""))
    ? item.purchase_status
    : "unknown";
  const install = INSTALL_ALLOWED.has(String(item.install_status ?? ""))
    ? item.install_status
    : "unknown";
  return {
    name,
    location: item.location ?? null,
    purchase_status: purchase,
    install_status: install,
  };
}

async function fetchObjectContext(
  supabase: any,
  objectId: string,
  userId: string,
) {
  const { data: membership, error: membershipError } = await supabase
    .from("object_members")
    .select("object_id")
    .eq("object_id", objectId)
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) return { error: membershipError };
  if (!membership) return { error: new Error("forbidden") };

  const { data: object, error: objectError } = await supabase
    .from("objects")
    .select("id, name, description")
    .eq("id", objectId)
    .maybeSingle();

  if (objectError) return { error: objectError };
  if (!object) return { error: new Error("not_found") };

  const { data: hardware, error: hardwareError } = await supabase
    .from("hardware")
    .select("name, location, purchase_status, install_status")
    .eq("object_id", objectId)
    .order("created_at", { ascending: true });

  if (hardwareError) return { error: hardwareError };

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("title, status, notes, assignee, due_date")
    .eq("object_id", objectId)
    .order("created_at", { ascending: true });

  if (tasksError) return { error: tasksError };

  return { object, hardware: hardware ?? [], tasks: tasks ?? [] };
}

async function loadTemplateById(supabase: any, id: string, userId: string) {
  const { data, error } = await supabase
    .from("object_templates")
    .select(
      `id, name, description, equipment_schema, is_public, created_by, created_at,
       template_tasks(position, task_templates(id, name, description, task_schema, created_by, created_at))`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) return { error };
  if (!data) return { error: new Error("not_found") };

  const formatted = {
    id: data.id,
    name: data.name,
    description: data.description ?? null,
    isPublic: data.is_public,
    owned: data.created_by === userId,
    createdBy: data.created_by,
    createdAt: data.created_at,
    equipment: Array.isArray(data.equipment_schema)
      ? data.equipment_schema
      : [],
    tasks: (data.template_tasks ?? [])
      .filter((item) => item?.task_templates)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((item) => {
        const task = item.task_templates!;
        return {
          id: task.id,
          name: task.name,
          description: task.description ?? null,
          schema: task.task_schema ?? {
            title: task.name,
            status: null,
            notes: task.description ?? null,
            assignee: null,
            due_date: null,
          },
        };
      }),
  };

  return { data: formatted };
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

  const objectId = String(body.objectId ?? "").trim();
  const name = String(body.name ?? "").trim();
  const description =
    typeof body.description === "string" ? body.description.trim() : undefined;
  const isPublic = parseBoolean(body.isPublic);

  if (!objectId) {
    return jsonResponse({ error: "object_id_required" }, 400);
  }
  if (!name) {
    return jsonResponse({ error: "name_required" }, 400);
  }

  const auth = await requireUser(req);
  if ("errorResponse" in auth) return auth.errorResponse;
  const { supabase, user } = auth;

  const context = await fetchObjectContext(supabase, objectId, user.id);
  if (context.error) {
    const message = context.error.message;
    if (message === "forbidden")
      return jsonResponse({ error: "forbidden" }, 403);
    if (message === "not_found")
      return jsonResponse({ error: "not_found" }, 404);
    return jsonResponse({ error: message }, 500);
  }

  const equipment = (context.hardware ?? []).map(sanitizeHardware);
  const tasks = (context.tasks ?? []).map((task: any, index: number) =>
    sanitizeTask(task, index),
  );

  const { data: template, error: templateError } = await supabase
    .from("object_templates")
    .insert([
      {
        name,
        description: description ?? context.object?.description ?? null,
        equipment_schema: equipment,
        is_public: isPublic,
        created_by: user.id,
      },
    ])
    .select("id")
    .single();

  if (templateError || !template) {
    return jsonResponse(
      { error: templateError?.message ?? "failed_to_create" },
      500,
    );
  }

  let taskTemplateIds: string[] = [];

  if (tasks.length) {
    const { data: createdTasks, error: taskInsertError } = await supabase
      .from("task_templates")
      .insert(
        tasks.map((task) => ({
          name: task.name,
          description: task.description,
          task_schema: task.task_schema,
          is_public: isPublic,
          created_by: user.id,
        })),
      )
      .select("id");

    if (taskInsertError) {
      await supabase.from("object_templates").delete().eq("id", template.id);
      return jsonResponse({ error: taskInsertError.message }, 500);
    }

    taskTemplateIds = (createdTasks ?? []).map((item) => item.id);

    if (taskTemplateIds.length) {
      const links = taskTemplateIds.map((taskId, index) => ({
        object_template_id: template.id,
        task_template_id: taskId,
        position: index,
      }));
      const { error: linkError } = await supabase
        .from("template_tasks")
        .insert(links);
      if (linkError) {
        await supabase
          .from("template_tasks")
          .delete()
          .eq("object_template_id", template.id);
        await supabase
          .from("task_templates")
          .delete()
          .in("id", taskTemplateIds);
        await supabase.from("object_templates").delete().eq("id", template.id);
        return jsonResponse({ error: linkError.message }, 500);
      }
    }
  }

  const loaded = await loadTemplateById(supabase, template.id, user.id);
  if (loaded.error) {
    return jsonResponse({ error: loaded.error.message }, 500);
  }

  return jsonResponse({ template: loaded.data }, 201);
}

if (import.meta.main) {
  serve(handler);
}

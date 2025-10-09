import type { User } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders, jsonResponse, requireUser } from "../_shared.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

type EquipmentItem = {
  name: string;
  location?: string | null;
  purchase_status?: string | null;
  install_status?: string | null;
};

type TaskSchema = {
  title: string;
  status?: string | null;
  notes?: string | null;
  assignee?: string | null;
  due_date?: string | null;
};

type RawTemplate = {
  id: string;
  name: string;
  description: string | null;
  equipment_schema: EquipmentItem[] | null;
  is_public: boolean;
  created_by: string;
  created_at: string;
  template_tasks?: Array<{
    position: number | null;
    task_templates?: {
      id: string;
      name: string;
      description: string | null;
      task_schema: TaskSchema | null;
      is_public: boolean;
      created_by: string;
      created_at: string;
    } | null;
  }> | null;
};

type FormattedTemplate = {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  owned: boolean;
  createdBy: string;
  createdAt: string;
  equipment: EquipmentItem[];
  tasks: Array<{
    id: string;
    name: string;
    description: string | null;
    schema: TaskSchema;
  }>;
};

function formatTemplates(raw: RawTemplate[], user: User): FormattedTemplate[] {
  return raw.map((template) => {
    const tasks = (template.template_tasks ?? [])
      .filter((item) => item?.task_templates)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((item) => {
        const task = item.task_templates!;
        return {
          id: task.id,
          name: task.name,
          description: task.description ?? null,
          schema: {
            title: task.task_schema?.title ?? task.name,
            status: task.task_schema?.status ?? null,
            notes: task.task_schema?.notes ?? task.description ?? null,
            assignee: task.task_schema?.assignee ?? null,
            due_date: task.task_schema?.due_date ?? null,
          },
        };
      });

    return {
      id: template.id,
      name: template.name,
      description: template.description ?? null,
      isPublic: template.is_public,
      owned: template.created_by === user.id,
      createdBy: template.created_by,
      createdAt: template.created_at,
      equipment: Array.isArray(template.equipment_schema)
        ? template.equipment_schema
        : [],
      tasks,
    };
  });
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "method_not_allowed" }, 405);
  }

  const auth = await requireUser(req);
  if ("errorResponse" in auth) return auth.errorResponse;

  const { supabase, user } = auth;

  const { data, error } = await supabase
    .from("object_templates")
    .select(
      `id, name, description, equipment_schema, is_public, created_by, created_at,
       template_tasks(position, task_templates(id, name, description, task_schema, is_public, created_by, created_at))`,
    )
    .or(`created_by.eq.${user.id},is_public.eq.true`)
    .order("name", { ascending: true })
    .order("position", { referencedTable: "template_tasks", ascending: true });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ templates: formatTemplates(data ?? [], user) });
}

if (import.meta.main) {
  serve(handler);
}

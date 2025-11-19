import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { TASK_STATUSES } from "../constants";
import { supabase } from "../supabaseClient";
import type { Task, UseTasksReturn } from "../types";
import { handleSupabaseError } from "../utils/handleSupabaseError";
import logger from "../utils/logger";

const isColumnMissingError = (err: unknown): boolean => {
  const code = err?.code ? String(err.code) : "";
  const msg = err?.message?.toLowerCase?.() || "";
  const mentionsField = msg.includes("due_date") || msg.includes("assigned_at");
  const looksLikeUnknownColumn =
    msg.includes("column") ||
    msg.includes("unknown") ||
    msg.includes("does not exist") ||
    msg.includes("not exist") ||
    msg.includes("not found");
  const likelyFromPostgrest = code === "42703" || code.startsWith("PGRST");
  return mentionsField && (likelyFromPostgrest || looksLikeUnknownColumn);
};

const isSchemaCacheError = (err: unknown): boolean => {
  const code = err?.code ? String(err.code) : "";
  const msg = err?.message?.toLowerCase?.() || "";
  // Treat generic PostgREST code or explicit schema cache mentions as cache-related
  return code.startsWith("PGRST") || msg.includes("schema cache");
};

const TASK_FIELDS =
  "id, title, status, notes, created_at, updated_at, object_id, user_id";
const TASK_FIELDS_FALLBACK =
  "id, title, status, notes, created_at, updated_at, object_id, user_id";

interface FetchTasksParams {
  offset?: number;
  limit?: number;
  status?: string;
}

interface LoadTasksParams {
  offset?: number;
  limit?: number;
  status?: string;
  query?: string;
}

export function useTasks(objectId: string | null): UseTasksReturn {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const requestSeqRef = useRef<number>(0);

  // helpers moved to module scope to remain stable across renders

  const fetchTasks = useCallback(
    async (
      objId: string,
      { offset = 0, limit = 20, status }: FetchTasksParams = {},
    ) => {
      try {
        if (!objId) return { data: [], error: null };
        if (!supabase)
          return {
            data: [],
            error: new Error("Supabase client not initialized"),
          };

        let baseQuery = supabase
          .from("tasks")
          .select(TASK_FIELDS)
          .eq("object_id", objId);

        if (status) {
          baseQuery = baseQuery.eq("status", status);
        }
        let result = await baseQuery
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);
        if (
          isColumnMissingError(result.error) ||
          isSchemaCacheError(result.error)
        ) {
          let fbQuery = supabase
            .from("tasks")
            .select(TASK_FIELDS_FALLBACK)
            .eq("object_id", objId);
          if (status) {
            fbQuery = fbQuery.eq("status", status);
          }
          result = await fbQuery
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        }
        if (result.error) throw result.error;
        return result;
      } catch (err) {
        logger.error("fetchTasks failed", err);
        await handleSupabaseError(err, navigate, "Ошибка загрузки задач");
        return { data: null, error: err };
      }
    },
    [navigate],
  );

  const insertTask = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        const {
          planned_date: _planned_date,
          plan_date: _plan_date,
          executor,
          assignee_id,
          assignee,
          title,
          status: inputStatus,
          due_date,
          notes,
          object_id,
        } = data;
        const status = inputStatus ?? "pending";
        const validStatuses = TASK_STATUSES.map(s => s.value || s);
        if (!validStatuses.includes(status)) {
          throw new Error(`Недопустимый статус задачи: ${status}. Допустимые: ${validStatuses.join(", ")}`);
        }
        const taskDataBase = {
          title,
          status,
          notes,
          object_id,
          assignee: assignee ?? executor ?? assignee_id ?? null,
        };
        const taskData = {
          ...taskDataBase,
          due_date,
          // always set assignment date to now on create (if column exists)
          assigned_at: new Date().toISOString(),
        };
        let result = await supabase
          .from("tasks")
          .insert([taskData])
          .select(TASK_FIELDS)
          .single();
        if (
          isColumnMissingError(result.error) ||
          isSchemaCacheError(result.error)
        ) {
          result = await supabase
            .from("tasks")
            .insert([taskDataBase])
            .select(TASK_FIELDS_FALLBACK)
            .single();
        }
        if (result.error) throw result.error;
        return result;
      } catch (err) {
        const message =
          err.message === "Недопустимый статус задачи"
            ? "Недопустимый статус задачи"
            : "Ошибка добавления задачи";
        await handleSupabaseError(err, navigate, message);
        return { data: null, error: err };
      }
    },
    [navigate],
  );

  const updateTaskInner = useCallback(
    async (id: string, data: Record<string, unknown>) => {
      try {
        const {
          planned_date: _planned_date,
          plan_date: _plan_date,
          executor,
          assignee_id,
          assignee,
          title,
          status: inputStatus,
          due_date,
          notes,
          object_id,
        } = data;
        
        // Валидация статуса
        if (inputStatus) {
          const validStatuses = TASK_STATUSES.map(s => s.value || s);
          if (!validStatuses.includes(inputStatus)) {
            throw new Error(`Недопустимый статус задачи: ${inputStatus}. Допустимые: ${validStatuses.join(", ")}`);
          }
        }
        
        const status = inputStatus;
        const taskDataBase = {
          title,
          status,
          notes,
          object_id,
          assignee: assignee ?? executor ?? assignee_id ?? null,
        };
        const taskData = {
          ...taskDataBase,
          due_date,
        };
        let result = await supabase
          .from("tasks")
          .update(taskData)
          .eq("id", id)
          .select(TASK_FIELDS)
          .single();
        if (
          isColumnMissingError(result.error) ||
          isSchemaCacheError(result.error)
        ) {
          result = await supabase
            .from("tasks")
            .update(taskDataBase)
            .eq("id", id)
            .select(TASK_FIELDS_FALLBACK)
            .single();
        }
        if (result.error) throw result.error;
        return result;
      } catch (err) {
        await handleSupabaseError(err, navigate, "Ошибка обновления задачи");
        return { data: null, error: err };
      }
    },
    [navigate],
  );

  const deleteTaskInner = useCallback(
    async (id: string) => {
      try {
        const result = await supabase.from("tasks").delete().eq("id", id);
        if (result.error) throw result.error;
        return result;
      } catch (err) {
        await handleSupabaseError(err, navigate, "Ошибка удаления задачи");
        return { data: null, error: err };
      }
    },
    [navigate],
  );

  const loadTasks = useCallback(
    async ({ offset = 0, limit = 20, status, query }: LoadTasksParams = {}) => {
      setLoading(true);
      const seq = ++requestSeqRef.current;
      if (!objectId) {
        setTasks([]);
        setError(null);
        setLoading(false);
        return { data: [], error: null };
      }
      const { data, error: err } = await fetchTasks(objectId, {
        offset,
        limit,
        status,
      });
      if (seq !== requestSeqRef.current) {
        return { data: null, error: null };
      }
      if (err) {
        setError(err.message || "Ошибка загрузки задач");
        setTasks([]);
      } else {
        const filtered = applyQueryFilter(data || [], query || "");
        setTasks(filtered);
        setError(null);
      }
      setLoading(false);
      return { data, error: err };
    },
    [objectId, fetchTasks],
  );

  const createTask = useCallback(
    async (data: Partial<Task>): Promise<void> => {
      const { data: newTask, error: err } = await insertTask(data);
      if (!err && newTask) {
        // Prepend to show immediately at the top (matches newest-first order)
        setTasks((prev) => [newTask, ...prev]);
      }
      if (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [insertTask],
  );

  const updateTask = useCallback(
    async (id: string, data: Partial<Task>): Promise<void> => {
      const { data: updated, error: err } = await updateTaskInner(id, data);
      if (!err && updated) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
      if (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [updateTaskInner],
  );

  const deleteTask = useCallback(
    async (id: string): Promise<void> => {
      const { error: err } = await deleteTaskInner(id);
      if (!err) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
      if (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [deleteTaskInner],
  );

  // Realtime updates for tasks of the selected object
  useEffect(() => {
    if (!objectId) return;
    // Guard for tests or environments without realtime configured
    if (typeof supabase?.channel !== "function") return;

    const channel = supabase
      .channel(`tasks:${objectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tasks",
          filter: `object_id=eq.${objectId}`,
        },
        (payload) => {
          const newTask = payload?.new as Task;
          if (!newTask) return;
          setTasks((prev) => {
            // Skip if already present (e.g., after local create)
            const exists = prev.some((t) => t.id === newTask.id);
            if (exists) {
              return prev.map((t) => (t.id === newTask.id ? newTask : t));
            }
            return [newTask, ...prev];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tasks",
          filter: `object_id=eq.${objectId}`,
        },
        (payload) => {
          const updated = payload?.new as Task;
          if (!updated) return;
          setTasks((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t)),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "tasks",
          filter: `object_id=eq.${objectId}`,
        },
        (payload) => {
          const old = payload?.old;
          if (!old) return;
          setTasks((prev) => prev.filter((t) => t.id !== old.id));
        },
      );

    channel.subscribe();

    return () => {
      try {
        if (supabase) {
          supabase.removeChannel(channel);
        }
      } catch {
        // ignore
      }
    };
  }, [objectId]);

  const refreshTasks = useCallback(async () => {
    await loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refreshTasks,
  };
}

function applyQueryFilter(items: Task[], rawQuery: string): Task[] {
  const q = (rawQuery || "").trim().toLowerCase();
  if (!q) return items;
  const m = q.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  let iso: string | null = null;
  if (m) {
    const [_fullMatch, dd, mm, yyyy] = m;
    iso = `${yyyy}-${mm}-${dd}`;
  }
  return items.filter((t: Task) => {
    const title = (t.title || "").toLowerCase();
    const assignee = (t.assignee || "").toLowerCase();
    const isEmailAssignee = assignee.includes("@");
    const due = (t.due_date || "").slice(0, 10);
    if (iso && due === iso) return true;
    if (title.includes(q)) return true;
    if (!isEmailAssignee && assignee && assignee.includes(q)) return true;
    return false;
  });
}

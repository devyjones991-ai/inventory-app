import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/supabaseClient";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import { useNavigate } from "react-router-dom";
import logger from "@/utils/logger";
import { TASK_STATUSES } from "@/constants/taskStatus";

const isColumnMissingError = (err) => {
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

const isSchemaCacheError = (err) => {
  const code = err?.code ? String(err.code) : "";
  const msg = err?.message?.toLowerCase?.() || "";
  // Treat generic PostgREST code or explicit schema cache mentions as cache-related
  return code.startsWith("PGRST") || msg.includes("schema cache");
};

const TASK_FIELDS =
  "id, title, status, assignee, due_date, assigned_at, notes, created_at";
const TASK_FIELDS_FALLBACK = "id, title, status, assignee, notes, created_at";

export function useTasks(objectId) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // helpers moved to module scope to remain stable across renders

  const fetchTasks = useCallback(
    async (objId, { offset = 0, limit = 20, status, assignee } = {}) => {
      try {
        if (!objId) return { data: [], error: null };
        let baseQuery = supabase
          .from("tasks")
          .select(TASK_FIELDS)
          .eq("object_id", objId);

        if (status) {
          baseQuery = baseQuery.eq("status", status);
        }
        if (assignee) {
          baseQuery = baseQuery.ilike("assignee", `%${assignee}%`);
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
          if (assignee) {
            fbQuery = fbQuery.ilike("assignee", `%${assignee}%`);
          }
          result = await fbQuery
            .order("created_at", { ascending: false })
            .range(offset, offset + limit - 1);
        }
        if (result.error) throw result.error;
        return result;
      } catch (err) {
        logger.error("fetchTasks failed", err);
        await handleSupabaseError(
          err,
          navigate,
          "РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р·Р°РґР°С‡",
        );
        return { data: null, error: err };
      }
    },
    [navigate],
  );

  const insertTask = useCallback(
    async (data) => {
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
        const status = inputStatus ?? "planned";
        if (!TASK_STATUSES.includes(status)) {
          throw new Error("РќРµРґРѕРїСѓСЃС‚РёРјС‹Р№ СЃС‚Р°С‚СѓСЃ Р·Р°РґР°С‡Рё");
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
          err.message === "РќРµРґРѕРїСѓСЃС‚РёРјС‹Р№ СЃС‚Р°С‚СѓСЃ Р·Р°РґР°С‡Рё"
            ? "РќРµРґРѕРїСѓСЃС‚РёРјС‹Р№ СЃС‚Р°С‚СѓСЃ Р·Р°РґР°С‡Рё"
            : "РћС€РёР±РєР° РґРѕР±Р°РІР»РµРЅРёСЏ Р·Р°РґР°С‡Рё";
        await handleSupabaseError(err, navigate, message);
        return { data: null, error: err };
      }
    },
    [navigate],
  );

  const updateTaskInner = useCallback(
    async (id, data) => {
      try {
        const {
          planned_date: _planned_date,
          plan_date: _plan_date,
          executor,
          assignee_id,
          assignee,
          title,
          status,
          due_date,
          notes,
          object_id,
        } = data;
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
        await handleSupabaseError(
          err,
          navigate,
          "РћС€РёР±РєР° РѕР±РЅРѕРІР»РµРЅРёСЏ Р·Р°РґР°С‡Рё",
        );
        return { data: null, error: err };
      }
    },
    [navigate],
  );

  const deleteTaskInner = useCallback(
    async (id) => {
      try {
        const result = await supabase.from("tasks").delete().eq("id", id);
        if (result.error) throw result.error;
        return result;
      } catch (err) {
        await handleSupabaseError(
          err,
          navigate,
          "РћС€РёР±РєР° СѓРґР°Р»РµРЅРёСЏ Р·Р°РґР°С‡Рё",
        );
        return { data: null, error: err };
      }
    },
    [navigate],
  );

  const loadTasks = useCallback(
    async ({ offset = 0, limit = 20, status, assignee } = {}) => {
      setLoading(true);
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
        assignee,
      });
      if (err) {
        setError(err.message || "РћС€РёР±РєР° Р·Р°РіСЂСѓР·РєРё Р·Р°РґР°С‡");
        setTasks([]);
      } else {
        setTasks(data || []);
        setError(null);
      }
      setLoading(false);
      return { data, error: err };
    },
    [objectId, fetchTasks],
  );

  const createTask = useCallback(
    async (data) => {
      const { data: newTask, error: err } = await insertTask(data);
      if (!err && newTask) {
        // Prepend to show immediately at the top (matches newest-first order)
        setTasks((prev) => [newTask, ...prev]);
      }
      return { data: newTask, error: err };
    },
    [insertTask],
  );

  const updateTask = useCallback(
    async (id, data) => {
      const { data: updated, error: err } = await updateTaskInner(id, data);
      if (!err && updated) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
      return { data: updated, error: err };
    },
    [updateTaskInner],
  );

  const deleteTask = useCallback(
    async (id) => {
      const { data: del, error: err } = await deleteTaskInner(id);
      if (!err) {
        setTasks((prev) => prev.filter((t) => t.id !== id));
      }
      return { data: del, error: err };
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
          const newTask = payload?.new;
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
          const updated = payload?.new;
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
        supabase.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  }, [objectId]);

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}

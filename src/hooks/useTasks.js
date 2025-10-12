import { useState, useCallback, useEffect } from "react";
import { useRef } from "react";
import { useNavigate } from "react-router-dom";

import { TASK_STATUSES } from "@/constants";
import { supabase } from "@/supabaseClient";
import { handleSupabaseError } from "@/utils/handleSupabaseError";
import logger from "@/utils/logger";

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
  "id, title, status, assignee, due_date, assigned_at, notes, created_at, signed_by, signed_at, signature_hash";
const TASK_FIELDS_FALLBACK = "id, title, status, assignee, notes, created_at";

const isSignatureColumnError = (err) => {
  const msg = err?.message?.toLowerCase?.() || "";
  return (
    msg.includes("signed_by") ||
    msg.includes("signed_at") ||
    msg.includes("signature_hash")
  );
};

const buildSignaturePatch = (signature) => {
  if (!signature) return {};
  const patch = {};
  if (signature.signedBy) patch.signed_by = signature.signedBy;
  if (signature.signedAt) patch.signed_at = signature.signedAt;
  if (signature.signatureHash) patch.signature_hash = signature.signatureHash;
  return patch;
};

export function useTasks(objectId) {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestSeqRef = useRef(0);

  // helpers moved to module scope to remain stable across renders

  const fetchTasks = useCallback(
    async (objId, { offset = 0, limit = 20, status } = {}) => {
      try {
        if (!objId) return { data: [], error: null };
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
          isSignatureColumnError(result.error) ||
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
    async (data, signature) => {
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
          throw new Error("Недопустимый статус задачи");
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
        const signaturePatch = buildSignaturePatch(signature);
        const taskDataSigned = Object.keys(signaturePatch).length
          ? { ...taskData, ...signaturePatch }
          : taskData;
        let result = await supabase
          .from("tasks")
          .insert([taskDataSigned])
          .select(TASK_FIELDS)
          .single();
        if (
          isColumnMissingError(result.error) ||
          isSignatureColumnError(result.error) ||
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
    async (id, data, signature) => {
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
        const signaturePatch = buildSignaturePatch(signature);
        const taskDataSigned = Object.keys(signaturePatch).length
          ? { ...taskData, ...signaturePatch }
          : taskData;
        let result = await supabase
          .from("tasks")
          .update(taskDataSigned)
          .eq("id", id)
          .select(TASK_FIELDS)
          .single();
        if (
          isColumnMissingError(result.error) ||
          isSignatureColumnError(result.error) ||
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
    async (id, signature) => {
      try {
        const signaturePatch = buildSignaturePatch(signature);
        if (Object.keys(signaturePatch).length) {
          const sigResult = await supabase
            .from("tasks")
            .update(signaturePatch)
            .eq("id", id);
          if (
            sigResult.error &&
            !isColumnMissingError(sigResult.error) &&
            !isSchemaCacheError(sigResult.error) &&
            !isSignatureColumnError(sigResult.error)
          ) {
            throw sigResult.error;
          }
        }
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
    async ({ offset = 0, limit = 20, status, query } = {}) => {
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
        const filtered = applyQueryFilter(data || [], query);
        setTasks(filtered);
        setError(null);
      }
      setLoading(false);
      return { data, error: err };
    },
    [objectId, fetchTasks],
  );

  const createTask = useCallback(
    async (data, signature) => {
      const { data: newTask, error: err } = await insertTask(data, signature);
      if (!err && newTask) {
        // Prepend to show immediately at the top (matches newest-first order)
        setTasks((prev) => [newTask, ...prev]);
      }
      return { data: newTask, error: err };
    },
    [insertTask],
  );

  const updateTask = useCallback(
    async (id, data, signature) => {
      const { data: updated, error: err } = await updateTaskInner(
        id,
        data,
        signature,
      );
      if (!err && updated) {
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      }
      return { data: updated, error: err };
    },
    [updateTaskInner],
  );

  const deleteTask = useCallback(
    async (id, signature) => {
      const { data: del, error: err } = await deleteTaskInner(id, signature);
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

function applyQueryFilter(items, rawQuery) {
  const q = (rawQuery || "").trim().toLowerCase();
  if (!q) return items;
  const m = q.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  let iso = null;
  if (m) {
    const [_, dd, mm, yyyy] = m;
    iso = `${yyyy}-${mm}-${dd}`;
  }
  return items.filter((t) => {
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

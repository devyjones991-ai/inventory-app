import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { supabase } from "../supabaseClient";
import { exportInventory, importInventory } from "../utils/exportImport";
import { handleSupabaseError } from "../utils/handleSupabaseError";
import logger from "../utils/logger";
import { useAuth } from "./useAuth";

const SELECTED_OBJECT_KEY = "selectedObjectId";

export function useObjectList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [objects, setObjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);

  const fetchObjects = useCallback(async () => {
    let data;
    try {
      const { data: fetchedData, error } = await supabase
        .from("objects")
        .select("id, name, description")
        .order("created_at", { ascending: true });
      if (error) {
        if (error.status === 401) {
          await supabase.auth.signOut();
          navigate("/auth");
          return;
        }
        if (error.status === 403) {
          toast.error("Недостаточно прав");
          setFetchError("Недостаточно прав");
          return;
        }
        // Проверяем на ошибки RLS и рекурсии
        const errorMessage = error.message || String(error);
        if (errorMessage.includes('infinite recursion') || errorMessage.includes('recursion')) {
          logger.error("Ошибка RLS рекурсии при загрузке объектов:", error);
          toast.error("Ошибка доступа: проблема с политиками безопасности. Обратитесь к администратору.");
          setFetchError("Ошибка доступа: проблема с политиками безопасности");
          return;
        }
        if (errorMessage.includes('row-level security') || errorMessage.includes('RLS') || error.code === 'PGRST116') {
          logger.error("Ошибка RLS при загрузке объектов:", error);
          toast.error("Ошибка доступа: проблема с политиками безопасности");
          setFetchError("Ошибка доступа: проблема с политиками безопасности");
          return;
        }
        logger.error("Ошибка загрузки объектов:", error);
        toast.error("Ошибка загрузки объектов: " + error.message);
        await handleSupabaseError(error, navigate, "Ошибка загрузки объектов");
        setFetchError("Ошибка загрузки объектов: " + error.message);
        return;
      }
      data = fetchedData;
      setObjects(data);
    } catch (err) {
      logger.error("Ошибка загрузки объектов:", err);
      toast.error("Ошибка загрузки объектов: " + err.message);
      setFetchError("Ошибка загрузки объектов: " + err.message);
      return;
    }
    if (data.length === 0) {
      setIsEmpty(true);
      setSelected(null);
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.removeItem(SELECTED_OBJECT_KEY);
        } catch {
          /* empty */
        }
      }
      return;
    }
    setIsEmpty(false);
    let savedId = null;
    if (typeof localStorage !== "undefined") {
      try {
        savedId = localStorage.getItem(SELECTED_OBJECT_KEY);
      } catch {
        savedId = null;
      }
    }
    if (savedId) {
      const saved = data.find((o) => o.id === Number(savedId));
      if (saved) setSelected(saved);
      else if (!selected && data.length) setSelected(data[0]);
    } else if (!selected && data.length) {
      setSelected(data[0]);
    }
  }, [navigate, selected]);

  useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

  async function saveObject(name, description = "", editingObject) {
    if (user?.email !== "devyjones991@gmail.com") {
      toast.error("Только администратор может изменять данные");
      return false;
    }
    if (!name.trim()) return false;
    if (editingObject) {
      const { data, error } = await supabase
        .from("objects")
        .update({ name, description: description || "" })
        .eq("id", editingObject.id)
        .select("id, name, description")
        .single();
      if (error) {
        if (error.status === 403) toast.error("Недостаточно прав");
        else toast.error("Ошибка редактирования: " + error.message);
        await handleSupabaseError(error, navigate, "Ошибка редактирования");
        return false;
      }
      setObjects((prev) =>
        prev.map((o) => (o.id === editingObject.id ? data : o)),
      );
      if (selected?.id === editingObject.id) setSelected(data);
      return true;
    } else {
      const { data, error } = await supabase
        .from("objects")
        .insert([{ name, description: description || "" }])
        .select("id, name, description")
        .single();
      if (error) {
        if (error.status === 403) toast.error("Недостаточно прав");
        else toast.error("Ошибка добавления: " + error.message);
        await handleSupabaseError(error, navigate, "Ошибка добавления");
        return false;
      }
      setObjects((prev) => [...prev, data]);
      setSelected(data);
      setIsEmpty(false);
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(SELECTED_OBJECT_KEY, data.id);
        } catch {
          /* empty */
        }
      }
      return true;
    }
  }

  // Редактирование только названия объекта
  async function updateObjectName(objectId, newName) {
    if (!newName.trim()) {
      toast.error("Название не может быть пустым");
      return false;
    }
    const { data, error } = await supabase
      .from("objects")
      .update({ name: newName.trim() })
      .eq("id", objectId)
      .select("id, name, description")
      .single();
    if (error) {
      if (error.status === 403) toast.error("Недостаточно прав");
      else toast.error("Ошибка редактирования названия: " + error.message);
      await handleSupabaseError(error, navigate, "Ошибка редактирования названия");
      return false;
    }
    setObjects((prev) =>
      prev.map((o) => (o.id === objectId ? data : o)),
    );
    if (selected?.id === objectId) setSelected(data);
    toast.success("Название обновлено");
    return true;
  }

  // Редактирование только описания объекта
  async function updateObjectDescription(objectId, newDescription) {
    const { data, error } = await supabase
      .from("objects")
      .update({ description: newDescription || "" })
      .eq("id", objectId)
      .select("id, name, description")
      .single();
    if (error) {
      if (error.status === 403) toast.error("Недостаточно прав");
      else toast.error("Ошибка редактирования описания: " + error.message);
      await handleSupabaseError(error, navigate, "Ошибка редактирования описания");
      return false;
    }
    setObjects((prev) =>
      prev.map((o) => (o.id === objectId ? data : o)),
    );
    if (selected?.id === objectId) setSelected(data);
    toast.success("Описание обновлено");
    return true;
  }

  async function deleteObject(id) {
    if (user?.email !== "devyjones991@gmail.com") {
      toast.error("Только администратор может удалять данные");
      return false;
    }

    const { error } = await supabase.from("objects").delete().eq("id", id);
    if (error) {
      if (error.status === 403) toast.error("Недостаточно прав");
      else toast.error("Ошибка удаления: " + error.message);
      await handleSupabaseError(error, navigate, "Ошибка удаления");
      return false;
    }
    setObjects((prev) => {
      const updated = prev.filter((o) => o.id !== id);
      if (selected?.id === id) {
        const next = updated[0] || null;
        setSelected(next);
        if (typeof localStorage !== "undefined") {
          try {
            if (next) localStorage.setItem(SELECTED_OBJECT_KEY, next.id);
            else localStorage.removeItem(SELECTED_OBJECT_KEY);
          } catch {
            /* empty */
          }
        }
      }
      if (updated.length === 0) {
        setIsEmpty(true);
      }
      return updated;
    });
    toast.success("Объект удалён");
    return true;
  }

  function handleSelect(obj) {
    setSelected(obj);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(SELECTED_OBJECT_KEY, obj.id);
      } catch {
        /* empty */
      }
    }
  }

  function handleUpdateSelected(updated) {
    setSelected(updated);
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.setItem(SELECTED_OBJECT_KEY, updated.id);
      } catch {
        /* empty */
      }
    }
    setObjects((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  async function importFromFile(file) {
    try {
      const res = await importInventory(file);
      if (res?.invalidRows) {
        toast.error(`Невалидных строк: ${res.invalidRows}`);
      } else {
        toast.success("Импорт выполнен");
      }
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function exportToFile() {
    try {
      const blob = await exportInventory();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "multiminder.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Экспорт выполнен");
    } catch (err) {
      toast.error(err.message);
    }
  }

  return {
    objects,
    selected,
    fetchError,
    isEmpty,
    handleSelect,
    handleUpdateSelected,
    saveObject,
    updateObjectName,
    updateObjectDescription,
    deleteObject,
    importFromFile,
    exportToFile,
  };
}

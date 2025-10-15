import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { t } from "../i18n";
import { supabase } from "../supabaseClient";
import { Hardware } from "../types";
import { handleSupabaseError } from "../utils/handleSupabaseError";

const PURCHASE_ALLOWED = ["not_paid", "paid"];
const INSTALL_ALLOWED = ["not_installed", "installed"];

function normalizeStatus(value: unknown, allowed: string[]): string {
  const v = String(value ?? "").trim();
  return allowed.includes(v) ? v : allowed[0];
}

export function useHardware() {
  const navigate = useNavigate();
  const [hardware, setHardware] = useState<Hardware[]>([]);

  // --- низкоуровневые обращения к Supabase ---
  const fetchHardware = useCallback(
    async (objectId: string) => {
      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }
        const result = await supabase
          .from("hardware")
          .select("id, name, location, purchase_status, install_status")
          .eq("object_id", objectId)
          .order("created_at");
        if (result.error) throw result.error;
        return result;
      } catch (error) {
        console.error("Error fetching hardware:", error);
        await handleSupabaseError(
          error,
          navigate,
          "Ошибка загрузки оборудования",
        );
        return { data: null, error };
      }
    },
    [navigate],
  );

  const createHardwareRecord = useCallback(
    async (data: Partial<Hardware>) => {
      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }
        const result = await supabase
          .from("hardware")
          .insert(data)
          .select()
          .single();
        if (result.error) throw result.error;
        return result;
      } catch (error) {
        console.error("Error creating hardware:", error);
        await handleSupabaseError(
          error,
          navigate,
          "Ошибка создания оборудования",
        );
        return { data: null, error };
      }
    },
    [navigate],
  );

  const updateHardwareRecord = useCallback(
    async (id: string, data: Partial<Hardware>) => {
      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }
        const result = await supabase
          .from("hardware")
          .update(data)
          .eq("id", id)
          .select()
          .single();
        if (result.error) throw result.error;
        return result;
      } catch (error) {
        console.error("Error updating hardware:", error);
        await handleSupabaseError(
          error,
          navigate,
          "Ошибка обновления оборудования",
        );
        return { data: null, error };
      }
    },
    [navigate],
  );

  const deleteHardwareRecord = useCallback(
    async (id: string) => {
      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized");
        }
        const result = await supabase.from("hardware").delete().eq("id", id);
        if (result.error) throw result.error;
        return result;
      } catch (error) {
        console.error("Error deleting hardware:", error);
        await handleSupabaseError(
          error,
          navigate,
          "Ошибка удаления оборудования",
        );
        return { data: null, error };
      }
    },
    [navigate],
  );

  // --- высокоуровневые функции ---
  const loadHardware = useCallback(
    async (objectId: string) => {
      const result = await fetchHardware(objectId);
      if (result.data) {
        setHardware(result.data);
      }
      return result;
    },
    [fetchHardware],
  );

  const createHardware = useCallback(
    async (data: Partial<Hardware>) => {
      const result = await createHardwareRecord(data);
      if (result.data) {
        setHardware((prev) => [...prev, result.data]);
      }
      return result;
    },
    [createHardwareRecord],
  );

  const updateHardware = useCallback(
    async (id: string, data: Partial<Hardware>) => {
      const result = await updateHardwareRecord(id, data);
      if (result.data) {
        setHardware((prev) =>
          prev.map((item) => (item.id === id ? result.data : item)),
        );
      }
      return result;
    },
    [updateHardwareRecord],
  );

  const deleteHardware = useCallback(
    async (id: string) => {
      const result = await deleteHardwareRecord(id);
      if (!result.error) {
        setHardware((prev) => prev.filter((item) => item.id !== id));
      }
      return result;
    },
    [deleteHardwareRecord],
  );

  return {
    hardware,
    loadHardware,
    createHardware,
    updateHardware,
    deleteHardware,
  };
}

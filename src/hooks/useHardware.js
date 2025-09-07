import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { t } from "@/i18n";
import { supabase } from "@/supabaseClient";
import { handleSupabaseError } from "@/utils/handleSupabaseError";

export function useHardware() {
  const navigate = useNavigate();
  const [hardware, setHardware] = useState([]);

  // --- низкоуровневые обращения к Supabase ---
  const fetchHardware = useCallback(
    async (objectId) => {
      try {
        const result = await supabase
          .from("hardware")
          .select("id, name, location, purchase_status, install_status")
          .eq("object_id", objectId)
          .order("created_at");
        if (result.error) throw result.error;
        return result;
      } catch (error) {
        await handleSupabaseError(error, navigate, t("hardware.errors.load"));
        return { data: null, error };
      }
    },
    [navigate],
  );

  const insertHardware = useCallback(
    async (data) => {
      try {
        const result = await supabase
          .from("hardware")
          .insert([data])
          .select("id, name, location, purchase_status, install_status")
          .single();
        if (result.error) throw result.error;
        return result;
      } catch (error) {
        await handleSupabaseError(error, navigate, t("hardware.errors.create"));
        return { data: null, error };
      }
    },
    [navigate],
  );

  const updateHardwareSupabase = useCallback(
    async (id, data) => {
      try {
        const result = await supabase
          .from("hardware")
          .update(data)
          .eq("id", id)
          .select("id, name, location, purchase_status, install_status")
          .single();
        if (result.error) throw result.error;
        return result;
      } catch (error) {
        await handleSupabaseError(error, navigate, t("hardware.errors.update"));
        return { data: null, error };
      }
    },
    [navigate],
  );

  const deleteHardwareSupabase = useCallback(
    async (id) => {
      try {
        const result = await supabase.from("hardware").delete().eq("id", id);
        if (result.error) throw result.error;
        return result;
      } catch (error) {
        await handleSupabaseError(error, navigate, t("hardware.errors.delete"));
        return { data: null, error };
      }
    },
    [navigate],
  );

  // --- методы работы с локальным состоянием ---
  const loadHardware = useCallback(
    async (objectId) => {
      const { data, error } = await fetchHardware(objectId);
      if (!error) setHardware(data || []);
      return { data, error };
    },
    [fetchHardware],
  );

  const createHardware = useCallback(
    async (data) => {
      const { data: created, error } = await insertHardware(data);
      if (!error && created) setHardware((prev) => [...prev, created]);
      return { data: created, error };
    },
    [insertHardware],
  );

  const updateHardware = useCallback(
    async (id, data) => {
      const { data: updated, error } = await updateHardwareSupabase(id, data);
      if (!error && updated)
        setHardware((prev) =>
          prev.map((item) => (item.id === id ? updated : item)),
        );
      return { data: updated, error };
    },
    [updateHardwareSupabase],
  );

  const deleteHardware = useCallback(
    async (id) => {
      const { data, error } = await deleteHardwareSupabase(id);
      if (!error) setHardware((prev) => prev.filter((item) => item.id !== id));
      return { data, error };
    },
    [deleteHardwareSupabase],
  );

  return {
    hardware,
    loadHardware,
    createHardware,
    updateHardware,
    deleteHardware,
  };
}

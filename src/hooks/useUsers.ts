import { useState, useEffect, useCallback } from "react";

import { supabase } from "../supabaseClient";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("full_name", { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      console.log("Fetched users:", data);
      setUsers(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Ошибка загрузки пользователей";
      setError(errorMessage);
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
}

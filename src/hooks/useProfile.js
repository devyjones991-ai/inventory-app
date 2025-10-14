import { useState, useEffect, useCallback } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/supabaseClient";

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Загружаем профиль пользователя
  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      setProfile(data);
    } catch (err) {
      console.error("Ошибка загрузки профиля:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Обновляем профиль
  const updateProfile = async (updates) => {
    if (!user) {
      throw new Error("Пользователь не авторизован");
    }

    try {
      setError(null);

      const { data, error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setProfile(data);
      return { data, error: null };
    } catch (err) {
      console.error("Ошибка обновления профиля:", err);
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Обновляем данные пользователя в auth
  const updateUserData = async (userData) => {
    if (!user) {
      throw new Error("Пользователь не авторизован");
    }

    try {
      setError(null);

      const { data, error: updateError } = await supabase.auth.updateUser({
        data: userData,
      });

      if (updateError) {
        throw updateError;
      }

      return { data, error: null };
    } catch (err) {
      console.error("Ошибка обновления данных пользователя:", err);
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Обновляем пароль
  const updatePassword = async (newPassword) => {
    if (!user) {
      throw new Error("Пользователь не авторизован");
    }

    try {
      setError(null);

      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      return { data, error: null };
    } catch (err) {
      console.error("Ошибка обновления пароля:", err);
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Обновляем email
  const updateEmail = async (newEmail) => {
    if (!user) {
      throw new Error("Пользователь не авторизован");
    }

    try {
      setError(null);

      const { data, error: updateError } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (updateError) {
        throw updateError;
      }

      return { data, error: null };
    } catch (err) {
      console.error("Ошибка обновления email:", err);
      setError(err.message);
      return { data: null, error: err };
    }
  };

  // Загружаем профиль при изменении пользователя
  useEffect(() => {
    fetchProfile();
  }, [user, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    updateUserData,
    updatePassword,
    updateEmail,
  };
}

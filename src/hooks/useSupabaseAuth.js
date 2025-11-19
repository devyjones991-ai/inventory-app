import { useState } from "react";

import { supabase } from "../supabaseClient";
import { pushNotification } from "../utils/notifications";

export function useSupabaseAuth() {
  const [error, setError] = useState(null);

  const getSession = () => supabase.auth.getSession();
  const onAuthStateChange = (callback) =>
    supabase.auth.onAuthStateChange(callback);

  const signUp = async (email, password, username) => {
    setError(null);

    // Проверка, что Supabase настроен
    if (!supabase) {
      const error = new Error("Supabase не настроен. Проверьте переменные окружения.");
      setError(error.message);
      return { data: null, error };
    }

    try {
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } },
        });

      if (signUpError) {
        // Улучшенная обработка ошибок
        let errorMessage = signUpError.message;
        if (signUpError.message?.includes("Failed to fetch") || 
            signUpError.message?.includes("NetworkError") ||
            signUpError.message?.includes("ERR_NAME_NOT_RESOLVED")) {
          errorMessage = "Не удалось подключиться к серверу. Проверьте настройки Supabase.";
        }
        setError(errorMessage);
      } else if (signUpData.user && signUpData.user.confirmed_at === null) {
        pushNotification(
          "Регистрация",
          "Проверьте почту для подтверждения аккаунта",
        );
      }

      return { data: signUpData, error: signUpError };
    } catch (err) {
      // Обработка сетевых ошибок
      let errorMessage = err.message || "Произошла ошибка при регистрации";
      if (err.message?.includes("Failed to fetch") || 
          err.message?.includes("NetworkError") ||
          err.message?.includes("ERR_NAME_NOT_RESOLVED")) {
        errorMessage = "Не удалось подключиться к серверу. Проверьте настройки Supabase.";
      }
      setError(errorMessage);
      return { data: null, error: { message: errorMessage, ...err } };
    }
  };

  const signIn = async (email, password) => {
    setError(null);
    
    if (!supabase) {
      const error = new Error("Supabase не настроен. Проверьте переменные окружения.");
      setError(error.message);
      return { data: null, error };
    }

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      
      if (signInError) {
        let errorMessage = signInError.message;
        if (signInError.message?.includes("Failed to fetch") || 
            signInError.message?.includes("NetworkError") ||
            signInError.message?.includes("ERR_NAME_NOT_RESOLVED")) {
          errorMessage = "Не удалось подключиться к серверу. Проверьте настройки Supabase.";
        } else if (signInError.message?.includes("Invalid login credentials") ||
                   signInError.message?.includes("Email not confirmed")) {
          errorMessage = "Неверный email или пароль";
        }
        setError(errorMessage);
        return { data, error: { ...signInError, message: errorMessage } };
      }
      
      return { data, error: null };
    } catch (err) {
      let errorMessage = err.message || "Произошла ошибка при входе";
      if (err.message?.includes("Failed to fetch") || 
          err.message?.includes("NetworkError") ||
          err.message?.includes("ERR_NAME_NOT_RESOLVED")) {
        errorMessage = "Не удалось подключиться к серверу. Проверьте настройки Supabase.";
      }
      setError(errorMessage);
      return { data: null, error: { message: errorMessage, ...err } };
    }
  };

  const signOut = () => supabase.auth.signOut();

  const resetPassword = async (email) => {
    setError(null);
    try {
      const { data, error: resetError } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
      if (resetError) {
        setError(resetError.message);
      }
      return { data, error: resetError };
    } catch (err) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  return {
    getSession,
    onAuthStateChange,
    signUp,
    signIn,
    signOut,
    resetPassword,
    error,
  };
}

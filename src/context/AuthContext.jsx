import { createContext, useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { supabase, isSupabaseConfigured } from "@/supabaseClient";
import { isApiConfigured } from "@/apiConfig";
import logger from "@/utils/logger";
import { fetchSession, fetchRole } from "@/services/authService";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext({
  user: null,
  role: null,
  isLoading: true,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    if (!isApiConfigured) {
      logger.error("Не задан VITE_API_BASE_URL. API недоступно.");
      toast.error("Конфигурация: не установлен VITE_API_BASE_URL");
    }

    const loadSession = async () => {
      setIsLoading(true);
      const { user: currentUser, error: sessionError } = await fetchSession();
      if (sessionError) {
        logger.error("Ошибка получения сессии:", sessionError);
        toast.error("Ошибка получения сессии: " + sessionError.message);
        setUser(null);
        setRole(null);
        setIsLoading(false);
        return;
      }
      setUser(currentUser);
      if (currentUser && isApiConfigured) {
        const { role: fetchedRole, error: roleError } = await fetchRole(
          currentUser.id,
        );
        if (roleError) {
          logger.error("Ошибка получения роли:", roleError);
          toast.error("Ошибка получения роли: " + roleError.message);
          setRole(null);
        } else {
          setRole(fetchedRole);
        }
      } else {
        setRole(null);
      }
      setIsLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        loadSession();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setRole(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      isLoading,
    }),
    [user, role, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

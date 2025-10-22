import { createContext, useEffect, useState, useMemo, ReactNode } from "react";
import { toast } from "react-hot-toast";

import { isApiConfigured } from "../apiConfig";
import { fetchSession, fetchRole } from "../services/authService";
import { supabase, isSupabaseConfigured } from "../supabaseClient";
import { User } from "../types";
import logger from "../utils/logger";

interface AuthContextType {
  user: User | null;
  role: string | null;
  isLoading: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
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

    const initAuth = async () => {
      try {
        const { user: sessionUser, error } = await fetchSession();
        if (error) {
          logger.error("Ошибка инициализации аутентификации:", error);
          return;
        }
        if (sessionUser) {
          setUser(sessionUser);
          const userRole = await fetchRole(sessionUser.id);
          setRole(userRole);
        }
      } catch (error) {
        logger.error("Ошибка инициализации аутентификации:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.id);
      if (event === "SIGNED_IN" && session?.user) {
        console.log("User signed in:", session.user.email);
        setUser(session.user);
        const userRole = await fetchRole(session.user.id);
        setRole(userRole);
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        setUser(null);
        setRole(null);
      }
      setIsLoading(false);
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

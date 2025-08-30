import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";

export function useAuth() {
  const { user, role, isLoading } = useContext(AuthContext);
  return {
    user,
    role,
    isLoading,
  };
}

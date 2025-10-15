import { toast } from "react-hot-toast";
import { NavigateFunction } from "react-router-dom";

import { supabase } from "../supabaseClient";

import logger from "./logger";

export async function handleSupabaseError(
  error: unknown,
  navigate: NavigateFunction | null,
  message = "Ошибка",
): Promise<void> {
  if (!error) return;
  logger.error(message, error);
  if (error.status === 401 || error.status === 403) {
    if (supabase) {
      await supabase.auth.signOut();
    }
    if (navigate) navigate("/auth");
    else if (typeof window !== "undefined") window.location.href = "/auth";
  } else {
    toast.error(error.message ? `${message}: ${error.message}` : message);
  }
}

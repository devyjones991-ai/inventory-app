import { supabase } from "@/supabaseClient";
import { toast } from "react-hot-toast";
import logger from "@/utils/logger";

export async function handleSupabaseError(error, navigate, message = "Ошибка") {
  if (!error) return;
  logger.error(message, error);
  if (error.status === 401 || error.status === 403) {
    await supabase.auth.signOut();
    if (navigate) navigate("/auth");
    else if (typeof window !== "undefined") window.location.href = "/auth";
  } else {
    toast.error(error.message ? `${message}: ${error.message}` : message);
  }
}

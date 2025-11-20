import { apiBaseUrl, isApiConfigured } from "@/apiConfig";
import { supabase } from "@/supabaseClient";

const DEFAULT_TIMEOUT = 10000;

function withTimeout(operation, timeout = DEFAULT_TIMEOUT) {
  const controller = new AbortController();
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("Request timed out"));
    }, timeout);
  });
  return Promise.race([operation(controller.signal), timeoutPromise]).finally(
    () => {
      clearTimeout(timer);
    },
  );
}

function formatError(error) {
  return { message: error.message };
}

let cacheGetAvailable = null;

export async function checkCacheGet({ timeout } = {}) {
  if (!isApiConfigured) return false;
  if (cacheGetAvailable !== null) return cacheGetAvailable;
  try {
    const res = await withTimeout(
      (signal) =>
        fetch(`${apiBaseUrl}/functions/v1/cacheGet`, {
          method: "OPTIONS",
          signal,
        }),
      timeout,
    );
    cacheGetAvailable = res.status !== 404;
  } catch {
    cacheGetAvailable = false;
  }
  return cacheGetAvailable;
}

export async function fetchRole(id, { timeout } = {}) {
  // Сначала пробуем напрямую через Supabase
  try {
    const { data, error } = await withTimeout(
      () =>
        supabase.from("profiles").select("role").eq("id", id).maybeSingle(),
      timeout,
    );
    if (error) {
      console.error("fetchRole: Supabase error:", error);
      // Если ошибка 500 или RLS, пробуем еще раз с более простым запросом
      if (error.code === 'PGRST116' || error.message?.includes('500') || error.message?.includes('RLS')) {
        console.log("fetchRole: Retrying with simpler query...");
        // Пробуем через RPC функцию, если она есть
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_role', { user_id: id });
          if (!rpcError && rpcData) {
            return { role: rpcData };
          }
        } catch (rpcErr) {
          console.log("fetchRole: RPC not available, continuing...");
        }
      }
      throw error;
    }
    if (data?.role) {
      console.log("fetchRole: Role found:", data.role);
      return { role: data.role };
    }
    // Если данных нет, возвращаем null, но не ошибку
    return { role: null };
  } catch (error) {
    console.error("fetchRole: Exception:", error);
    // Не возвращаем ошибку, а возвращаем null, чтобы не блокировать приложение
    return { role: null };
  }
  
  // Старый код с cacheGet (оставляем для совместимости)
  if (!(await checkCacheGet({ timeout }))) {
    return { role: null };
  }
  try {
    const res = await withTimeout(
      (signal) =>
        fetch(
          `${apiBaseUrl}/functions/v1/cacheGet?table=${encodeURIComponent("profiles")}&id=${encodeURIComponent(id)}`,
          { signal },
        ),
      timeout,
    );
    if (!res.ok) {
      let message;
      try {
        const errorBody = await res.clone().json();
        message = errorBody?.message;
      } catch {
        // ignore JSON parse errors
      }
      if (!message) {
        message = await res.text();
      }
      if (
        res.status === 404 ||
        message?.includes("Requested function was not found")
      ) {
        cacheGetAvailable = false;
        return fetchRole(id, { timeout });
      }
      throw new Error(message);
    }
    const body = await res.json();
    return { role: body.data?.role ?? null };
  } catch (error) {
    return { error: formatError(error) };
  }
}

export async function fetchSession({ timeout } = {}) {
  try {
    const {
      data: { session },
      error,
    } = await withTimeout(() => supabase.auth.getSession(), timeout);
    if (error) throw error;
    return { user: session?.user ?? null };
  } catch (error) {
    return { error: formatError(error) };
  }
}

export function __resetCache() {
  cacheGetAvailable = null;
}

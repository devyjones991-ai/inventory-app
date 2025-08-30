import { supabase } from "@/supabaseClient";
import { apiBaseUrl, isApiConfigured } from "@/apiConfig";

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
  if (!(await checkCacheGet({ timeout }))) {
    try {
      const { data, error } = await withTimeout(
        () =>
          supabase.from("profiles").select("role").eq("id", id).maybeSingle(),
        timeout,
      );
      if (error) throw error;
      return { role: data?.role ?? null };
    } catch (error) {
      return { error: formatError(error) };
    }
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

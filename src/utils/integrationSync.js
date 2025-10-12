import logger from "./logger";

import { apiBaseUrl, isApiConfigured } from "@/apiConfig";
import { supabase } from "@/supabaseClient";

async function buildAuthHeaders() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (err) {
    logger.error("Не удалось получить токен сессии", err);
  }
  return {};
}

function ensureApiConfigured() {
  if (!isApiConfigured) {
    logger.error(
      "Не задана переменная окружения VITE_API_BASE_URL. Интеграции недоступны.",
    );
    throw new Error("API не настроен");
  }
}

export async function fetchIntegrationStatus({ signal } = {}) {
  ensureApiConfigured();
  try {
    const headers = await buildAuthHeaders();
    const res = await fetch(
      `${apiBaseUrl}/functions/v1/import-export?action=status`,
      {
        method: "GET",
        headers,
        signal,
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Не удалось получить статусы (${res.status}): ${text}`);
    }
    const body = await res.json();
    return body?.data ?? [];
  } catch (err) {
    logger.error("fetchIntegrationStatus error", err);
    throw err;
  }
}

export async function updateIntegrationSchedule(payload, { signal } = {}) {
  ensureApiConfigured();
  try {
    const headers = {
      ...(await buildAuthHeaders()),
      "Content-Type": "application/json",
    };
    const res = await fetch(
      `${apiBaseUrl}/functions/v1/import-export?action=schedule`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
        signal,
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Не удалось сохранить расписание (${res.status}): ${text}`,
      );
    }
    return await res.json();
  } catch (err) {
    logger.error("updateIntegrationSchedule error", err);
    throw err;
  }
}

export async function triggerIntegrationRun(payload, { signal } = {}) {
  ensureApiConfigured();
  try {
    const headers = {
      ...(await buildAuthHeaders()),
      "Content-Type": "application/json",
    };
    const res = await fetch(
      `${apiBaseUrl}/functions/v1/import-export?action=run`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal,
      },
    );
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Не удалось запустить синхронизацию (${res.status}): ${text}`,
      );
    }
    return await res.json();
  } catch (err) {
    logger.error("triggerIntegrationRun error", err);
    throw err;
  }
}

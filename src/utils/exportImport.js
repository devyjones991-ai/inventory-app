import logger from "./logger";

import { apiBaseUrl, isApiConfigured } from "@/apiConfig";
import { supabase } from "@/supabaseClient";
export async function exportInventory() {
  const { data, error } = await supabase.functions.invoke("export-inventory");
  if (error) throw error;
  return data;
}
export async function importInventory(file) {
  const { data, error } = await supabase.functions.invoke("import-inventory", {
    body: file,
  });
  if (error) throw error;
  return data;
}
export async function exportTable(
  table,
  { format = "csv", columnMapping, filters, signal } = {},
) {
  if (!isApiConfigured) {
    logger.error(
      "Не задана переменная окружения VITE_API_BASE_URL. Экспорт невозможен.",
    );
    throw new Error("API не настроен");
  }
  try {
    const params = new URLSearchParams();
    params.set("format", format);
    if (columnMapping && Object.keys(columnMapping).length) {
      params.set("columnMapping", JSON.stringify(columnMapping));
    }
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });
    }
    const url = `${apiBaseUrl}/api/export/${table}?${params.toString()}`;
    const res = await fetch(url, { signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Export failed (${res.status}): ${text}`);
    }
    return await res.blob();
  } catch (err) {
    logger.error("exportTable error:", err);
    throw err;
  }
}
export async function importTable(table, file, { columnMapping, signal } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (columnMapping && Object.keys(columnMapping).length) {
    formData.append("columnMapping", JSON.stringify(columnMapping));
  }
  if (!isApiConfigured) {
    logger.error(
      "Не задана переменная окружения VITE_API_BASE_URL. Импорт невозможен.",
    );
    throw new Error("API не настроен");
  }
  try {
    const res = await fetch(`${apiBaseUrl}/api/import/${table}`, {
      method: "POST",
      body: formData,
      signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Import failed (${res.status}): ${text}`);
    }
    const result = await res.json();
    return {
      processedRows: result.processed ?? 0,
      errors: result.errors ?? [],
    };
  } catch (err) {
    logger.error("importTable error:", err);
    throw err;
  }
}

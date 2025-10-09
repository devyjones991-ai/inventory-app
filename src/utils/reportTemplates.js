import { VITE_SUPABASE_URL } from "@/env";
import { isSupabaseConfigured, supabase } from "@/supabaseClient";
import logger from "@/utils/logger";

export const REPORT_TYPES = [
  { value: "tasks", label: "Отчёт по задачам" },
  { value: "workAct", label: "Акт выполненных работ" },
];

export const REPORT_FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "xlsx", label: "XLSX" },
];

const EXTENDED_TASK_FIELDS =
  "id,title,status,assignee,created_at,due_date,notes," +
  [
    "time_spent_minutes",
    "duration_minutes",
    "worked_minutes",
    "work_minutes",
    "time_spent_hours",
    "duration_hours",
    "total_cost",
    "cost",
    "labor_cost",
    "materials_cost",
    "expenses",
  ].join(",");
const FALLBACK_TASK_FIELDS =
  "id,title,status,assignee,created_at,due_date,notes";

const TIME_FIELDS = [
  "time_spent_minutes",
  "duration_minutes",
  "worked_minutes",
  "work_minutes",
  "time_spent_hours",
  "duration_hours",
  "time_spent",
  "duration",
];
const COST_FIELDS = [
  "total_cost",
  "cost",
  "labor_cost",
  "materials_cost",
  "expenses",
];

const COLUMN_ERROR_CODES = new Set(["42703"]);

const ensureSupabase = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase не настроен");
  }
};

const isColumnError = (error) => {
  const code = error?.code ? String(error.code) : "";
  if (COLUMN_ERROR_CODES.has(code)) return true;
  const message = error?.message?.toLowerCase?.() || "";
  return (
    message.includes("column") ||
    message.includes("does not exist") ||
    message.includes("unknown") ||
    message.includes("not exist")
  );
};

const parseNumber = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const extractTimeMinutes = (task) => {
  for (const key of TIME_FIELDS) {
    if (!(key in task)) continue;
    const raw = task[key];
    if (raw === null || raw === undefined) continue;
    let minutes = parseNumber(raw);
    if (!minutes) continue;
    if (/hour/i.test(key)) {
      minutes *= 60;
    }
    return minutes;
  }
  return 0;
};

const extractCostValue = (task) => {
  return COST_FIELDS.reduce((sum, key) => {
    if (!(key in task)) return sum;
    return sum + parseNumber(task[key]);
  }, 0);
};

async function loadTasks({ objectId, dateFrom, dateTo }) {
  ensureSupabase();
  const rangeFrom = `${dateFrom}T00:00:00Z`;
  const rangeTo = `${dateTo}T23:59:59Z`;

  const baseQuery = supabase
    .from("tasks")
    .select(EXTENDED_TASK_FIELDS)
    .eq("object_id", objectId)
    .gte("created_at", rangeFrom)
    .lte("created_at", rangeTo);

  let result = await baseQuery;
  if (result.error && isColumnError(result.error)) {
    logger.warn("Extended task fields unavailable, falling back", result.error);
    const fallbackQuery = supabase
      .from("tasks")
      .select(FALLBACK_TASK_FIELDS)
      .eq("object_id", objectId)
      .gte("created_at", rangeFrom)
      .lte("created_at", rangeTo);
    result = await fallbackQuery;
  }
  if (result.error) {
    throw result.error;
  }
  return result.data ?? [];
}

export async function prepareReportData({ objectId, dateFrom, dateTo }) {
  const tasks = await loadTasks({ objectId, dateFrom, dateTo });

  const statusMap = new Map();
  tasks.forEach((task) => {
    const status = String(task.status ?? "unknown");
    const entry = statusMap.get(status) || {
      status,
      count: 0,
      totalTimeMinutes: 0,
      totalCost: 0,
    };
    entry.count += 1;
    const time = extractTimeMinutes(task);
    if (time) entry.totalTimeMinutes += time;
    const cost = extractCostValue(task);
    if (cost) entry.totalCost += cost;
    statusMap.set(status, entry);
  });

  const summary = {
    totalTasks: tasks.length,
    completedTasks: 0,
    totalTimeMinutes: 0,
    totalCost: 0,
    byStatus: Array.from(statusMap.values()),
  };

  summary.completedTasks =
    summary.byStatus.find((row) => row.status === "done")?.count ?? 0;
  summary.totalTimeMinutes = summary.byStatus.reduce(
    (sum, row) => sum + (row.totalTimeMinutes ?? 0),
    0,
  );
  summary.totalCost = summary.byStatus.reduce(
    (sum, row) => sum + (row.totalCost ?? 0),
    0,
  );

  const completedTasks = tasks
    .filter((task) => String(task.status).toLowerCase() === "done")
    .map((task) => ({
      id: task.id,
      title: task.title ?? "",
      assignee: task.assignee ?? null,
      created_at: task.created_at ?? null,
      due_date: task.due_date ?? null,
      notes: task.notes ?? null,
      timeMinutes: extractTimeMinutes(task) || null,
      cost: extractCostValue(task) || null,
    }));

  return { summary, completedTasks };
}

const parseFileName = (contentDisposition) => {
  if (!contentDisposition) return null;
  const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i.exec(
    contentDisposition,
  );
  if (!match) return null;
  const value = match[1] || match[2];
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const buildFunctionUrl = () => {
  if (!VITE_SUPABASE_URL) {
    throw new Error("Переменная VITE_SUPABASE_URL не задана");
  }
  return `${VITE_SUPABASE_URL.replace(/\/$/, "")}/functions/v1/reports`;
};

export async function downloadReport(options) {
  ensureSupabase();
  const { objectId, dateFrom, dateTo, reportTypes, format } = options;
  const aggregated = await prepareReportData({ objectId, dateFrom, dateTo });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) {
    logger.error("Не удалось получить сессию", sessionError);
    throw new Error("Не удалось получить токен авторизации");
  }
  if (!session?.access_token) {
    throw new Error("Пользователь не авторизован");
  }

  const url = buildFunctionUrl();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      objectId,
      dateFrom,
      dateTo,
      reportTypes,
      format,
      aggregated,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    logger.error("Report generation failed", response.status, errorText);
    throw new Error(
      `Ошибка генерации отчёта (${response.status}): ${
        errorText || "см. журнал"
      }`,
    );
  }

  const blob = await response.blob();
  const fileName = parseFileName(response.headers.get("Content-Disposition"));
  return { blob, fileName };
}

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import ExcelJS from "https://esm.sh/exceljs@4?target=deno";
import {
  PDFDocument,
  StandardFonts,
} from "https://esm.sh/pdf-lib@1.17.1?target=deno";

type ReportFormat = "pdf" | "xlsx";
type ReportType = "tasks" | "workAct";

type RequestPayload = {
  objectId: string;
  dateFrom: string;
  dateTo: string;
  reportTypes: ReportType[];
  format: ReportFormat;
  aggregated?: AggregatedPayload;
};

type AggregatedPayload = {
  summary: ReportSummary;
  completedTasks: CompletedTask[];
};

type ReportSummary = {
  totalTasks: number;
  completedTasks: number;
  totalTimeMinutes: number;
  totalCost: number;
  byStatus: Array<{
    status: string;
    count: number;
    totalTimeMinutes?: number;
    totalCost?: number;
  }>;
};

type CompletedTask = {
  id: string;
  title: string;
  assignee?: string | null;
  created_at?: string | null;
  due_date?: string | null;
  notes?: string | null;
  timeMinutes?: number | null;
  cost?: number | null;
};

type SupabaseClient = ReturnType<typeof createClient>;

const ALLOWED_REPORT_TYPES: ReportType[] = ["tasks", "workAct"];
const ALLOWED_FORMATS: ReportFormat[] = ["pdf", "xlsx"];

type TimeColumn = { name: string; multiplier: number };

const TIME_CANDIDATES: TimeColumn[] = [
  { name: "time_spent_minutes", multiplier: 1 },
  { name: "duration_minutes", multiplier: 1 },
  { name: "worked_minutes", multiplier: 1 },
  { name: "work_minutes", multiplier: 1 },
  { name: "time_spent", multiplier: 1 },
  { name: "duration", multiplier: 1 },
  { name: "time_spent_hours", multiplier: 60 },
  { name: "duration_hours", multiplier: 60 },
];
const COST_CANDIDATES = [
  "total_cost",
  "cost",
  "labor_cost",
  "materials_cost",
  "expenses",
];

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toISOString().slice(0, 10);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .substring(0, 60) || "report"
  );
}

function applyDateFilters(
  query: ReturnType<SupabaseClient["from"]>,
  objectId: string,
  dateFrom: string,
  dateTo: string,
) {
  let result = query.eq("object_id", objectId);
  if (dateFrom) {
    result = result.gte("created_at", `${dateFrom}T00:00:00Z`);
  }
  if (dateTo) {
    result = result.lte("created_at", `${dateTo}T23:59:59Z`);
  }
  return result;
}

async function fetchAvailableColumns(
  client: SupabaseClient,
): Promise<Set<string>> {
  const { data, error } = await client
    .from("information_schema.columns")
    .select("column_name")
    .eq("table_schema", "public")
    .eq("table_name", "tasks");
  if (error) {
    console.error("Failed to introspect columns", error);
    return new Set();
  }
  return new Set((data ?? []).map((row) => row.column_name as string));
}

async function collectAggregatedData(
  client: SupabaseClient,
  objectId: string,
  dateFrom: string,
  dateTo: string,
): Promise<AggregatedPayload> {
  const columns = await fetchAvailableColumns(client);
  const timeColumn = TIME_CANDIDATES.find((candidate) =>
    columns.has(candidate.name)
  );
  const costColumns = COST_CANDIDATES.filter((name) => columns.has(name));

  const selectParts = ["status", "count:id"];
  if (timeColumn) {
    selectParts.push(`total_time:${timeColumn.name}.sum()`);
  }
  costColumns.forEach((col) => {
    selectParts.push(`${col}_sum:${col}.sum()`);
  });

  const summaryQuery = applyDateFilters(
    client.from("tasks").select(selectParts.join(","), { group: "status" }),
    objectId,
    dateFrom,
    dateTo,
  );
  const { data: summaryData, error: summaryError } = await summaryQuery;
  if (summaryError) throw summaryError;

  const summaryByStatus = (summaryData ?? []).map((row) => {
    const base = {
      status: String(row.status ?? "unknown"),
      count: parseNumber(row.count),
    };
    if (timeColumn) {
      Object.assign(base, {
        totalTimeMinutes:
          parseNumber((row as Record<string, unknown>).total_time) *
          timeColumn.multiplier,
      });
    }
    if (costColumns.length) {
      const totalCost = costColumns.reduce((sum, col) => {
        const key = `${col}_sum`;
        return sum + parseNumber((row as Record<string, unknown>)[key]);
      }, 0);
      Object.assign(base, { totalCost });
    }
    return base;
  });

  const detailColumns = [
    "id",
    "title",
    "assignee",
    "created_at",
    "due_date",
    "notes",
  ];
  if (timeColumn) detailColumns.push(timeColumn.name);
  costColumns.forEach((col) => detailColumns.push(col));

  const completedQuery = applyDateFilters(
    client
      .from("tasks")
      .select(detailColumns.join(","))
      .eq("status", "done")
      .order("created_at", { ascending: true }),
    objectId,
    dateFrom,
    dateTo,
  );
  const { data: completedData, error: completedError } = await completedQuery;
  if (completedError) throw completedError;

  const completedTasks: CompletedTask[] = (completedData ?? []).map((row) => {
    const base: CompletedTask = {
      id: String(row.id),
      title: String(row.title ?? ""),
      assignee: row.assignee ?? null,
      created_at: row.created_at ?? null,
      due_date: row.due_date ?? null,
      notes: row.notes ?? null,
    };
    if (timeColumn) {
      base.timeMinutes =
        parseNumber((row as Record<string, unknown>)[timeColumn.name]) *
        timeColumn.multiplier;
    }
    if (costColumns.length) {
      base.cost = costColumns.reduce((sum, col) => {
        return sum + parseNumber((row as Record<string, unknown>)[col]);
      }, 0);
    }
    return base;
  });

  const totalTasks = summaryByStatus.reduce((sum, row) => sum + row.count, 0);
  const completedSummary = summaryByStatus.find((row) => row.status === "done");
  const completedCount = completedSummary?.count ?? 0;
  const totalTimeMinutes = summaryByStatus.reduce(
    (sum, row) => sum + (row.totalTimeMinutes ?? 0),
    0,
  );
  const totalCost = summaryByStatus.reduce(
    (sum, row) => sum + (row.totalCost ?? 0),
    0,
  );

  return {
    summary: {
      totalTasks,
      completedTasks: completedCount,
      totalTimeMinutes,
      totalCost,
      byStatus: summaryByStatus,
    },
    completedTasks,
  };
}

function formatMinutes(value: number): string {
  if (!value) return "0 ч";
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  if (!hours) return `${minutes} мин`;
  if (!minutes) return `${hours} ч`;
  return `${hours} ч ${minutes} мин`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

async function createPdfReport(
  payload: AggregatedPayload,
  objectName: string,
  dateFrom: string,
  dateTo: string,
  reportTypes: ReportType[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let page = pdfDoc.addPage();
  const { height } = page.getSize();
  let cursorY = height - 50;

  const lineHeight = 16;
  const marginX = 50;

  const writeLine = (
    text: string,
    options: { bold?: boolean; size?: number } = {},
  ) => {
    if (cursorY < 70) {
      page = pdfDoc.addPage();
      cursorY = page.getSize().height - 50;
    }
    const size = options.size ?? 12;
    page.drawText(text, {
      x: marginX,
      y: cursorY,
      size,
      font: options.bold ? fontBold : font,
    });
    cursorY -= lineHeight + (size - 12) * 0.5;
  };

  writeLine("Отчёт по объекту", { bold: true, size: 18 });
  writeLine(objectName || "Без названия", { bold: true, size: 14 });
  writeLine(`Период: ${formatDate(dateFrom)} — ${formatDate(dateTo)}`);
  writeLine("");

  const { summary, completedTasks } = payload;

  if (reportTypes.includes("tasks")) {
    writeLine("Отчёт по задачам", { bold: true, size: 16 });
    writeLine(`Всего задач: ${summary.totalTasks}`);
    writeLine(`Завершено: ${summary.completedTasks}`);
    writeLine(`Суммарное время: ${formatMinutes(summary.totalTimeMinutes)}`);
    writeLine(`Суммарная стоимость: ${formatCurrency(summary.totalCost)}`);
    writeLine("Статусы:");
    summary.byStatus.forEach((row) => {
      const parts = [`• ${row.status}: ${row.count}`];
      if (row.totalTimeMinutes) {
        parts.push(`время ${formatMinutes(row.totalTimeMinutes)}`);
      }
      if (row.totalCost) {
        parts.push(`стоимость ${formatCurrency(row.totalCost)}`);
      }
      writeLine(parts.join(", "));
    });
    writeLine("");
  }

  if (reportTypes.includes("workAct")) {
    writeLine("Акт выполненных работ", { bold: true, size: 16 });
    if (!completedTasks.length) {
      writeLine("Завершённых задач за период не найдено.");
    } else {
      completedTasks.forEach((task) => {
        writeLine(`• ${task.title}`);
        const details: string[] = [];
        if (task.assignee) details.push(`Исполнитель: ${task.assignee}`);
        if (task.due_date) details.push(`Срок: ${formatDate(task.due_date)}`);
        if (task.timeMinutes) {
          details.push(`Время: ${formatMinutes(task.timeMinutes)}`);
        }
        if (typeof task.cost === "number") {
          details.push(`Стоимость: ${formatCurrency(task.cost)}`);
        }
        if (details.length) writeLine(details.join("; "));
        if (task.notes) writeLine(`Примечание: ${task.notes}`);
        writeLine("");
      });
      writeLine(
        `Итого по выполненным задачам: ${formatMinutes(
          completedTasks.reduce(
            (sum, task) => sum + (task.timeMinutes ?? 0),
            0,
          ),
        )}, ${formatCurrency(
          completedTasks.reduce((sum, task) => sum + (task.cost ?? 0), 0),
        )}`,
        { bold: true },
      );
    }
  }

  return await pdfDoc.save();
}

async function createXlsxReport(
  payload: AggregatedPayload,
  objectName: string,
  dateFrom: string,
  dateTo: string,
  reportTypes: ReportType[],
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Inventory";
  const period = `${formatDate(dateFrom)} — ${formatDate(dateTo)}`;

  if (reportTypes.includes("tasks")) {
    const sheet = workbook.addWorksheet("Отчёт по задачам");
    sheet.columns = [
      { header: "Объект", key: "object", width: 32 },
      { header: "Период", key: "period", width: 24 },
      { header: "Всего задач", key: "total", width: 16 },
      { header: "Завершено", key: "done", width: 16 },
      { header: "Суммарное время", key: "time", width: 20 },
      { header: "Суммарная стоимость", key: "cost", width: 22 },
    ];
    sheet.addRow({
      object: objectName || "Без названия",
      period,
      total: payload.summary.totalTasks,
      done: payload.summary.completedTasks,
      time: formatMinutes(payload.summary.totalTimeMinutes),
      cost: formatCurrency(payload.summary.totalCost),
    });
    sheet.addRow({});
    sheet.addRow({
      object: "Статус",
      period: "Количество",
      total: "Время",
      done: "Стоимость",
    });
    payload.summary.byStatus.forEach((row) => {
      sheet.addRow({
        object: row.status,
        period: row.count,
        total: row.totalTimeMinutes ? formatMinutes(row.totalTimeMinutes) : "-",
        done: row.totalCost ? formatCurrency(row.totalCost) : "-",
      });
    });
  }

  if (reportTypes.includes("workAct")) {
    const sheet = workbook.addWorksheet("Акт работ");
    sheet.columns = [
      { header: "Название", key: "title", width: 40 },
      { header: "Исполнитель", key: "assignee", width: 24 },
      { header: "Создана", key: "created", width: 18 },
      { header: "Срок", key: "due", width: 18 },
      { header: "Время", key: "time", width: 16 },
      { header: "Стоимость", key: "cost", width: 18 },
      { header: "Примечание", key: "notes", width: 40 },
    ];
    payload.completedTasks.forEach((task) => {
      sheet.addRow({
        title: task.title,
        assignee: task.assignee ?? "",
        created: task.created_at ? formatDate(task.created_at) : "",
        due: task.due_date ? formatDate(task.due_date) : "",
        time: task.timeMinutes ? formatMinutes(task.timeMinutes) : "",
        cost: typeof task.cost === "number" ? formatCurrency(task.cost) : "",
        notes: task.notes ?? "",
      });
    });
    sheet.addRow({});
    sheet.addRow({
      title: "Итого",
      time: formatMinutes(
        payload.completedTasks.reduce(
          (sum, task) => sum + (task.timeMinutes ?? 0),
          0,
        ),
      ),
      cost: formatCurrency(
        payload.completedTasks.reduce((sum, task) => sum + (task.cost ?? 0), 0),
      ),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: RequestPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { objectId, dateFrom, dateTo, reportTypes, format, aggregated } =
    payload;

  if (!objectId || typeof objectId !== "string") {
    return new Response("objectId is required", { status: 400 });
  }
  if (!isIsoDate(dateFrom) || !isIsoDate(dateTo)) {
    return new Response("Invalid date range", { status: 400 });
  }
  if (!ALLOWED_FORMATS.includes(format)) {
    return new Response("Unsupported format", { status: 400 });
  }
  if (
    !Array.isArray(reportTypes) ||
    !reportTypes.length ||
    reportTypes.some((type) => !ALLOWED_REPORT_TYPES.includes(type))
  ) {
    return new Response("Invalid report types", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response("Service credentials are not configured", {
      status: 500,
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const roles =
    (userData.user.app_metadata?.roles as string[] | undefined) || [];
  if (!roles.includes("admin") && !roles.includes("manager")) {
    return new Response("Forbidden", { status: 403 });
  }

  const { data: objectRow, error: objectError } = await supabase
    .from("objects")
    .select("id,name")
    .eq("id", objectId)
    .maybeSingle();
  if (objectError) {
    console.error("Failed to load object", objectError);
    return new Response("Failed to load object", { status: 500 });
  }
  if (!objectRow) {
    return new Response("Object not found", { status: 404 });
  }

  let aggregatedData: AggregatedPayload | null = null;
  try {
    aggregatedData = await collectAggregatedData(
      supabase,
      objectId,
      dateFrom,
      dateTo,
    );
  } catch (err) {
    console.error("Failed to aggregate data", err);
    if (aggregated) {
      aggregatedData = aggregated;
    } else {
      return new Response("Failed to aggregate data", { status: 500 });
    }
  }

  if (!aggregatedData) {
    return new Response("No data available", { status: 404 });
  }

  const reportName = objectRow.name ?? "Отчёт";
  let fileBuffer: Uint8Array;
  try {
    if (format === "pdf") {
      fileBuffer = await createPdfReport(
        aggregatedData,
        reportName,
        dateFrom,
        dateTo,
        reportTypes,
      );
    } else {
      fileBuffer = await createXlsxReport(
        aggregatedData,
        reportName,
        dateFrom,
        dateTo,
        reportTypes,
      );
    }
  } catch (err) {
    console.error("Failed to generate document", err);
    return new Response("Failed to generate document", { status: 500 });
  }

  const filename = `${slugify(reportName)}_${dateFrom}_${dateTo}.${format}`;
  const headers = new Headers({
    "Content-Type":
      format === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  });

  return new Response(fileBuffer, { headers });
}

if (import.meta.main) {
  serve(handler);
}

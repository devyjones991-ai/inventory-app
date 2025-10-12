import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { unparse } from "https://esm.sh/papaparse@5.4.1";
import ExcelJS from "https://esm.sh/exceljs@4?target=deno";

const ALLOWED_TABLES = [
  "objects",
  "hardware",
  "tasks",
  "chat_messages",
  "financial_transactions",
] as const;
const FILTER_KEY_PATTERN = /^[a-zA-Z0-9_]+$/;

export async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // Expected path: /export/:table/:format
  if (segments.length < 3) {
    return new Response("Missing parameters", { status: 400 });
  }
  const table = segments[1];
  const format = segments[2];

  if (!ALLOWED_TABLES.includes(table as (typeof ALLOWED_TABLES)[number])) {
    return new Response("Forbidden", { status: 403 });
  }

  const columnsParam = url.searchParams.get("columns");
  const selectedColumns = columnsParam?.split(",").filter(Boolean);
  const columnMappingParam = url.searchParams.get("columnMapping");
  let columnMapping: Record<string, string> | null = null;
  if (columnMappingParam) {
    try {
      const parsed = JSON.parse(columnMappingParam);
      if (parsed && typeof parsed === "object") {
        columnMapping = Object.entries(parsed).reduce(
          (acc: Record<string, string>, [source, label]) => {
            if (typeof source === "string" && typeof label === "string") {
              acc[source.trim()] = label.trim();
            }
            return acc;
          },
          {},
        );
      }
    } catch {
      return new Response("Invalid columnMapping", { status: 400 });
    }
  }
  const columnsToSelect =
    selectedColumns || (columnMapping ? Object.keys(columnMapping) : undefined);
  const filters: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key === "columns") continue;
    if (!FILTER_KEY_PATTERN.test(key)) {
      return new Response("Forbidden", { status: 403 });
    }
    filters[key] = value;
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const roles =
    (userData.user.app_metadata?.roles as string[] | undefined) || [];
  if (!roles.includes("admin")) {
    return new Response("Forbidden", { status: 403 });
  }

  if (format === "csv") {
    const batchSize = 1000;
    let start = 0;
    let firstChunk = true;
    let header: string[] | undefined = selectedColumns;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async pull(controller) {
        let query = supabase
          .from(table)
          .select(columnsToSelect?.join(",") || "*");
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        const { data, error } = await query.range(start, start + batchSize - 1);
        if (error) {
          controller.error(error);
          return;
        }
        if (!data || data.length === 0) {
          controller.close();
          return;
        }
        if (!header && data.length) {
          header = columnsToSelect || Object.keys(data[0]);
        }
        const projected = data.map((row) => {
          const ordered = (columnsToSelect || Object.keys(row)).reduce(
            (acc: Record<string, unknown>, key) => {
              if (key in row) acc[key] = row[key];
              return acc;
            },
            {},
          );
          return ordered;
        });
        const csvColumns = (header || []).map((key) =>
          columnMapping?.[key]
            ? { label: columnMapping[key], value: key }
            : key,
        );
        const csv = unparse(projected, {
          header: firstChunk,
          columns: csvColumns.length ? csvColumns : header,
        });
        controller.enqueue(encoder.encode(csv + "\n"));
        firstChunk = false;
        start += batchSize;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${table}.csv"`,
      },
    });
  }

  if (format === "xlsx") {
    const batchSize = 1000;
    const { readable, writable } = new TransformStream();

    (async () => {
      const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
        stream: writable,
      });
      const worksheet = workbook.addWorksheet(table);
      const worksheetColumns = (columnsToSelect || []).map((c) => ({
        header: columnMapping?.[c] ?? c,
        key: c,
      }));
      if (worksheetColumns.length) {
        worksheet.columns = worksheetColumns;
      }
      let start = 0;
      while (true) {
        let query = supabase
          .from(table)
          .select(columnsToSelect?.join(",") || "*");
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
        const { data, error } = await query.range(start, start + batchSize - 1);
        if (error) {
          writable.abort(error);
          return;
        }
        if (!data || data.length === 0) break;
        data.forEach((row) => {
          const ordered = (columnsToSelect || Object.keys(row)).reduce(
            (acc: Record<string, unknown>, key) => {
              if (key in row) acc[key] = row[key];
              return acc;
            },
            {},
          );
          worksheet.addRow(ordered).commit();
        });
        start += batchSize;
      }
      await workbook.commit();
    })();

    return new Response(readable, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${table}.xlsx"`,
      },
    });
  }

  return new Response("Invalid format", { status: 400 });
}

if (import.meta.main) {
  serve(handler);
}

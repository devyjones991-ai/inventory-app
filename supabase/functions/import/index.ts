import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Papa from "https://esm.sh/papaparse@5.4.1";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests are allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const formData = await req.formData();
  const table = formData.get("table")?.toString();
  const file = formData.get("file") as File | null;

  if (!table || !file) {
    return new Response(
      JSON.stringify({ error: "Missing 'table' or 'file' in form data" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const requiredFields: Record<string, string[]> = {
    tasks: ["title", "assignee", "due_date"],
  };

  const ext = file.name.split(".").pop()?.toLowerCase();
  const buf = await file.arrayBuffer();
  let rows: Record<string, unknown>[] = [];

  if (ext === "csv") {
    const text = new TextDecoder().decode(buf);
    const parsed = Papa.parse<Record<string, unknown>>(text, { header: true });
    rows = (parsed.data as Record<string, unknown>[]) ?? [];
  } else if (ext === "xlsx" || ext === "xls") {
    const workbook = XLSX.read(buf, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  } else {
    return new Response(JSON.stringify({ error: "Unsupported file type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const errors: { row: number; error: string }[] = [];
  const valid: Record<string, unknown>[] = [];
  const required = requiredFields[table] ?? [];

  rows.forEach((row, idx) => {
    const missing = required.filter((f) => !(f in row) || row[f] === "");
    if (missing.length) {
      errors.push({
        row: idx + 2,
        error: `Missing fields: ${missing.join(", ")}`,
      });
    } else {
      valid.push(row);
    }
  });

  const client = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  let inserted = 0;
  if (valid.length) {
    const { error } = await client.from(table).insert(valid);
    if (error) {
      errors.push({ row: 0, error: error.message });
    } else {
      inserted = valid.length;
    }
  }

  return new Response(JSON.stringify({ inserted, errors }), {
    headers: { "Content-Type": "application/json" },
  });
});

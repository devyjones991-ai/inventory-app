import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.205.0/testing/asserts.ts";
import { handleRequest, type ImportDependencies } from "./index.ts";

Deno.test("метод кроме POST запрещён", async () => {
  const response = await handleRequest(
    new Request("https://example.com", { method: "GET" }),
  );
  assertStrictEquals(response.status, 405);
  assertEquals(await response.json(), {
    error: "Only POST requests are allowed",
  });
});

Deno.test("ошибка при отсутствии параметров формы", async () => {
  const response = await handleRequest(
    new Request("https://example.com", { method: "POST" }),
  );
  assertStrictEquals(response.status, 400);
  assertEquals(await response.json(), {
    error: "Missing 'table' or 'file' in form data",
  });
});

function createForm(table: string, file: File): FormData {
  const form = new FormData();
  form.set("table", table);
  form.set("file", file);
  return form;
}

Deno.test("возвращает 400 для неподдерживаемого расширения", async () => {
  const file = new File(["content"], "data.txt", { type: "text/plain" });
  const form = createForm("tasks", file);
  const response = await handleRequest(
    new Request("https://example.com", { method: "POST", body: form }),
  );
  assertStrictEquals(response.status, 400);
  assertEquals(await response.json(), { error: "Unsupported file type" });
});

Deno.test("проверяет обязательные поля и возвращает ошибки", async () => {
  const file = new File(["a,b\n1,2"], "data.csv", { type: "text/csv" });
  const calls: unknown[] = [];
  const deps: ImportDependencies = {
    parseCsv: () => [{ title: "", assignee: "", due_date: "" }],
    parseXlsx: () => [],
    createSupabaseClient: () =>
      ({
        from: () => ({
          insert: async (rows: unknown[]) => {
            calls.push(rows);
            return { error: null };
          },
        }),
      }) as any,
  };
  const form = createForm("tasks", file);
  const response = await handleRequest(
    new Request("https://example.com", { method: "POST", body: form }),
    deps,
  );
  assertStrictEquals(response.status, 200);
  assertEquals(await response.json(), {
    inserted: 0,
    errors: [{ row: 2, error: "Missing fields: title, assignee, due_date" }],
  });
  assertEquals(calls, []);
});

Deno.test("успешно импортирует валидные записи", async () => {
  const file = new File(["a,b\n1,2"], "data.csv", { type: "text/csv" });
  const inserted: unknown[] = [];
  const deps: ImportDependencies = {
    parseCsv: () => [
      { title: "Task", assignee: "John", due_date: "2024-01-01" },
    ],
    parseXlsx: () => [],
    createSupabaseClient: () =>
      ({
        from: () => ({
          insert: async (rows: unknown[]) => {
            inserted.push(...rows);
            return { error: null };
          },
        }),
      }) as any,
  };
  const form = createForm("tasks", file);
  const response = await handleRequest(
    new Request("https://example.com", { method: "POST", body: form }),
    deps,
  );
  assertStrictEquals(response.status, 200);
  assertEquals(await response.json(), { inserted: 1, errors: [] });
  assertEquals(inserted, [
    { title: "Task", assignee: "John", due_date: "2024-01-01" },
  ]);
});

Deno.test("ошибка вставки попадает в список ошибок", async () => {
  const file = new File(["a,b\n1,2"], "data.csv", { type: "text/csv" });
  const deps: ImportDependencies = {
    parseCsv: () => [
      { title: "Task", assignee: "John", due_date: "2024-01-01" },
    ],
    parseXlsx: () => [],
    createSupabaseClient: () =>
      ({
        from: () => ({
          insert: async () => ({ error: { message: "fail" } }),
        }),
      }) as any,
  };
  const form = createForm("tasks", file);
  const response = await handleRequest(
    new Request("https://example.com", { method: "POST", body: form }),
    deps,
  );
  assertStrictEquals(response.status, 200);
  assertEquals(await response.json(), {
    inserted: 0,
    errors: [{ row: 0, error: "fail" }],
  });
});

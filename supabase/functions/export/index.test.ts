import {
  assert,
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.205.0/testing/asserts.ts";
import { handleRequest, type ExportDependencies } from "./index.ts";

type AuthResult = {
  data: {
    user: { app_metadata?: { roles?: string[] }; [key: string]: unknown };
  } | null;
  error: { message: string } | null;
};

type QueryLogEntry = {
  table: string;
  filters: Record<string, string>;
  ranges: Array<{ start: number; end: number; columns?: string[] }>;
};

type SupabaseStubOptions = {
  authResult: AuthResult;
  tableData?: Record<string, Array<Record<string, unknown>>>;
  tableErrors?: Record<string, { message: string } | null>;
  queryLog: QueryLogEntry[];
};

function createSupabaseStub({
  authResult,
  tableData = {},
  tableErrors = {},
  queryLog,
}: SupabaseStubOptions): any {
  return {
    auth: {
      getUser: async () => authResult,
    },
    from(table: string) {
      const rows = tableData[table] ?? [];
      const tableError = tableErrors[table] ?? null;
      return {
        select(columnsRaw: string) {
          const columns =
            columnsRaw === "*" ? undefined : columnsRaw.split(",");
          const entry: QueryLogEntry = { table, filters: {}, ranges: [] };
          queryLog.push(entry);
          const builder: any = {
            eq(column: string, value: string) {
              entry.filters[column] = value;
              return builder;
            },
            async range(start: number, end: number) {
              entry.ranges.push({ start, end, columns });
              if (tableError) {
                return { data: null, error: tableError };
              }
              const filtered = rows.filter((row) =>
                Object.entries(entry.filters).every(
                  ([key, value]) => row[key] === value,
                ),
              );
              const slice = filtered.slice(start, end + 1).map((row) => {
                if (!columns) return row;
                const picked: Record<string, unknown> = {};
                for (const column of columns) {
                  picked[column] = row[column];
                }
                return picked;
              });
              return { data: slice, error: null };
            },
          };
          return builder;
        },
      };
    },
  };
}

Deno.test("возвращает 400 при отсутствии параметров", async () => {
  const response = await handleRequest(
    new Request("https://example.com/export"),
  );
  assertStrictEquals(response.status, 400);
  assertEquals(await response.text(), "Missing parameters");
});

Deno.test("запрещённая таблица возвращает 403", async () => {
  const response = await handleRequest(
    new Request("https://example.com/export/forbidden/csv"),
  );
  assertStrictEquals(response.status, 403);
  assertEquals(await response.text(), "Forbidden");
});

Deno.test("ошибка авторизации возвращает 401", async () => {
  const deps: ExportDependencies = {
    createSupabaseClient: () =>
      createSupabaseStub({
        authResult: { data: null, error: { message: "no" } },
        queryLog: [],
      }),
    csvStringify: () => "",
    createWorkbookWriter: () => ({
      addWorksheet: () => ({
        addRow: () => ({ commit() {} }),
        commit() {},
      }),
      commit: async () => {},
    }),
  };

  const response = await handleRequest(
    new Request("https://example.com/export/objects/csv"),
    deps,
  );
  assertStrictEquals(response.status, 401);
  assertEquals(await response.text(), "Unauthorized");
});

Deno.test("пользователь без роли admin получает 403", async () => {
  const deps: ExportDependencies = {
    createSupabaseClient: () =>
      createSupabaseStub({
        authResult: {
          data: { user: { app_metadata: { roles: ["user"] } } },
          error: null,
        },
        queryLog: [],
      }),
    csvStringify: () => "",
    createWorkbookWriter: () => ({
      addWorksheet: () => ({
        addRow: () => ({ commit() {} }),
        commit() {},
      }),
      commit: async () => {},
    }),
  };

  const response = await handleRequest(
    new Request("https://example.com/export/objects/csv"),
    deps,
  );
  assertStrictEquals(response.status, 403);
  assertEquals(await response.text(), "Forbidden");
});

Deno.test("CSV экспорт возвращает поток с данными по батчам", async () => {
  const queryLog: QueryLogEntry[] = [];
  const rows = Array.from({ length: 1100 }, (_, index) => ({
    id: index,
    name: `Item-${index}`,
    status: index % 2 === 0 ? "open" : "closed",
    extra: true,
  }));
  const csvCalls: Array<{ data: unknown[]; options: unknown }> = [];
  const deps: ExportDependencies = {
    createSupabaseClient: () =>
      createSupabaseStub({
        authResult: {
          data: { user: { app_metadata: { roles: ["admin"] } } },
          error: null,
        },
        tableData: { objects: rows },
        queryLog,
      }),
    csvStringify: (data, options) => {
      csvCalls.push({ data, options });
      return `chunk-${csvCalls.length}`;
    },
    createWorkbookWriter: () => ({
      addWorksheet: () => ({
        addRow: () => ({ commit() {} }),
        commit() {},
      }),
      commit: async () => {},
    }),
  };

  const response = await handleRequest(
    new Request(
      "https://example.com/export/objects/csv?columns=id,name&status=open",
      { headers: { Authorization: "Bearer token" } },
    ),
    deps,
  );

  assertStrictEquals(response.status, 200);
  assertStrictEquals(response.headers.get("Content-Type"), "text/csv");
  const text = await response.text();
  assertEquals(text, "chunk-1\nchunk-2\n");
  assertEquals(csvCalls.length, 2);
  const [firstCall, secondCall] = csvCalls;
  assertEquals((firstCall.options as { header: boolean }).header, true);
  assertEquals((secondCall.options as { header: boolean }).header, false);
  assertEquals((firstCall.data as Record<string, unknown>[]).length, 1000);
  assertEquals((secondCall.data as Record<string, unknown>[]).length, 100);
  assertEquals(Object.keys((firstCall.data as Record<string, unknown>[])[0]), [
    "id",
    "name",
  ]);
  const entry = queryLog[0];
  assertEquals(entry.table, "objects");
  assertEquals(entry.filters, { status: "open" });
  assertEquals(entry.ranges.slice(0, 2), [
    { start: 0, end: 999, columns: ["id", "name"] },
    { start: 1000, end: 1999, columns: ["id", "name"] },
  ]);
  assert(entry.ranges.length >= 2);
});

Deno.test("ошибка Supabase при CSV отдаёт 500", async () => {
  const queryLog: QueryLogEntry[] = [];
  const deps: ExportDependencies = {
    createSupabaseClient: () =>
      createSupabaseStub({
        authResult: {
          data: { user: { app_metadata: { roles: ["admin"] } } },
          error: null,
        },
        tableErrors: { objects: { message: "fail" } },
        queryLog,
      }),
    csvStringify: () => "",
    createWorkbookWriter: () => ({
      addWorksheet: () => ({
        addRow: () => ({ commit() {} }),
        commit() {},
      }),
      commit: async () => {},
    }),
  };

  const response = await handleRequest(
    new Request("https://example.com/export/objects/csv"),
    deps,
  );
  assertStrictEquals(response.status, 500);
  assertEquals(await response.text(), "fail");
});

Deno.test("XLSX экспорт записывает строки и закрывает поток", async () => {
  const queryLog: QueryLogEntry[] = [];
  const rows = Array.from({ length: 2 }, (_, index) => ({
    id: index,
    name: `Item-${index}`,
  }));
  const worksheetState: {
    columns?: { header: string; key: string }[];
    rows: Record<string, unknown>[];
    committed: boolean;
  } = {
    rows: [],
    committed: false,
  };
  const deps: ExportDependencies = {
    createSupabaseClient: () =>
      createSupabaseStub({
        authResult: {
          data: { user: { app_metadata: { roles: ["admin"] } } },
          error: null,
        },
        tableData: { objects: rows },
        queryLog,
      }),
    csvStringify: () => "",
    createWorkbookWriter: ({ stream }) => {
      const writer = stream.getWriter();
      return {
        addWorksheet: () => ({
          get columns() {
            return worksheetState.columns;
          },
          set columns(value) {
            worksheetState.columns = value;
          },
          addRow: (row: Record<string, unknown>) => {
            worksheetState.rows.push(row);
            return { commit() {} };
          },
          commit() {},
        }),
        commit: async () => {
          worksheetState.committed = true;
          await writer.close();
        },
      };
    },
  };

  const response = await handleRequest(
    new Request("https://example.com/export/objects/xlsx?columns=id,name"),
    deps,
  );

  assertStrictEquals(response.status, 200);
  assertStrictEquals(
    response.headers.get("Content-Type"),
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  const body = await response.arrayBuffer();
  assert(body.byteLength === 0);
  assertEquals(worksheetState.columns, [
    { header: "id", key: "id" },
    { header: "name", key: "name" },
  ]);
  assertEquals(worksheetState.rows, rows);
  assertEquals(worksheetState.committed, true);
  assertEquals(queryLog[0].ranges.length, 1);
});

Deno.test("неподдерживаемый формат возвращает 400", async () => {
  const deps: ExportDependencies = {
    createSupabaseClient: () =>
      createSupabaseStub({
        authResult: {
          data: { user: { app_metadata: { roles: ["admin"] } } },
          error: null,
        },
        queryLog: [],
      }),
    csvStringify: () => "",
    createWorkbookWriter: () => ({
      addWorksheet: () => ({
        addRow: () => ({ commit() {} }),
        commit() {},
      }),
      commit: async () => {},
    }),
  };
  const response = await handleRequest(
    new Request("https://example.com/export/objects/json"),
    deps,
  );
  assertStrictEquals(response.status, 400);
  assertEquals(await response.text(), "Invalid format");
});

Deno.test("недопустимый ключ фильтра даёт 403", async () => {
  const response = await handleRequest(
    new Request("https://example.com/export/objects/csv?invalid-key=value"),
  );
  assertStrictEquals(response.status, 403);
  assertEquals(await response.text(), "Forbidden");
});

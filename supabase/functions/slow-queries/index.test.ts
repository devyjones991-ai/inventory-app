import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.205.0/testing/asserts.ts";
import { handleRequest, type SlowQueriesDependencies } from "./index.ts";

type QueryResult = { data: any[] | null; error: { message: string } | null };

function createSupabaseStub(result: QueryResult, inserted: any[] = []): any {
  return {
    from(table: string) {
      if (table === "pg_stat_statements") {
        return {
          select: () => ({
            gt: () => Promise.resolve(result),
          }),
        };
      }
      if (table === "slow_query_logs") {
        return {
          insert: async (rows: any[]) => {
            inserted.push(...rows);
            return { error: null };
          },
        };
      }
      throw new Error("unexpected table");
    },
  };
}

Deno.test("возвращает 500 при ошибке Supabase", async () => {
  const deps: SlowQueriesDependencies = {
    createSupabaseClient: () =>
      createSupabaseStub({ data: null, error: { message: "boom" } }),
  };

  const response = await handleRequest(
    new Request("https://example.com"),
    deps,
  );
  assertStrictEquals(response.status, 500);
  assertEquals(await response.text(), "boom");
});

Deno.test("сохраняет найденные запросы", async () => {
  const inserted: any[] = [];
  const deps: SlowQueriesDependencies = {
    createSupabaseClient: () =>
      createSupabaseStub(
        {
          data: [
            { query: "select 1", mean_time: 600, calls: 3 },
            { query: "select 2", mean_time: 800, calls: 1 },
          ],
          error: null,
        },
        inserted,
      ),
    thresholdMs: 500,
  };

  const response = await handleRequest(
    new Request("https://example.com"),
    deps,
  );
  assertStrictEquals(response.status, 200);
  assertEquals(await response.json(), { stored: 2 });
  assertEquals(inserted, [
    { query: "select 1", mean_time: 600, calls: 3 },
    { query: "select 2", mean_time: 800, calls: 1 },
  ]);
});

Deno.test("возвращает stored 0 когда данных нет", async () => {
  const deps: SlowQueriesDependencies = {
    createSupabaseClient: () => createSupabaseStub({ data: [], error: null }),
  };

  const response = await handleRequest(
    new Request("https://example.com"),
    deps,
  );
  assertStrictEquals(response.status, 200);
  assertEquals(await response.json(), { stored: 0 });
});

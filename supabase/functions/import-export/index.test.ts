import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.205.0/testing/asserts.ts";
import { handleRequest, type ImportExportDependencies } from "./index.ts";

Deno.test("возвращает 401 при ошибке авторизации", async () => {
  const deps: ImportExportDependencies = {
    createSupabaseClient: () =>
      ({
        auth: {
          getUser: async () => ({
            data: { user: null },
            error: { message: "unauthorized" },
          }),
        },
      }) as any,
  };

  const response = await handleRequest(
    new Request("https://example.com", { method: "GET" }),
    deps,
  );
  assertStrictEquals(response.status, 401);
  assertEquals(await response.json(), { error: "Unauthorized" });
});

Deno.test("возвращает 403 если роль не подходит", async () => {
  const deps: ImportExportDependencies = {
    createSupabaseClient: () =>
      ({
        auth: {
          getUser: async () => ({
            data: {
              user: { app_metadata: { role: "viewer" }, user_metadata: {} },
            },
            error: null,
          }),
        },
      }) as any,
  };

  const response = await handleRequest(
    new Request("https://example.com", { method: "GET" }),
    deps,
  );
  assertStrictEquals(response.status, 403);
  assertEquals(await response.json(), { error: "Forbidden" });
});

Deno.test("возвращает ok для допустимых ролей", async () => {
  const deps: ImportExportDependencies = {
    createSupabaseClient: () =>
      ({
        auth: {
          getUser: async () => ({
            data: { user: { app_metadata: { role: "admin" } } },
            error: null,
          }),
        },
      }) as any,
  };

  const response = await handleRequest(
    new Request("https://example.com", { method: "GET" }),
    deps,
  );
  assertStrictEquals(response.status, 200);
  assertEquals(await response.json(), { message: "ok" });
});

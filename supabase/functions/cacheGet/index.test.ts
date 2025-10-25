import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.205.0/testing/asserts.ts";
import { handleRequest, type CacheGetDependencies } from "./index.ts";

Deno.test("OPTIONS запрос возвращает 200", async () => {
  const response = await handleRequest(
    new Request("https://example.com", { method: "OPTIONS" }),
  );
  assertStrictEquals(response.status, 200);
});

Deno.test("отсутствующий параметр table возвращает 400", async () => {
  const response = await handleRequest(
    new Request("https://example.com", { method: "GET" }),
  );
  assertStrictEquals(response.status, 400);
  assertEquals(await response.json(), { error: "table is required" });
});

Deno.test("запрещённая таблица возвращает 403", async () => {
  const response = await handleRequest(
    new Request("https://example.com?table=forbidden", { method: "GET" }),
  );
  assertStrictEquals(response.status, 403);
  assertEquals(await response.json(), { error: "table is not allowed" });
});

function createAuthFailureDeps(): CacheGetDependencies {
  return {
    createSupabaseClient: () => ({
      auth: {
        getUser: async () => ({ data: null, error: { message: "nope" } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
    createRedisClient: () => ({
      get: async () => null,
      set: async () => {},
      del: async () => {},
    }),
  };
}

Deno.test("неавторизованный пользователь получает 401", async () => {
  const request = new Request("https://example.com?table=objects", {
    method: "GET",
    headers: { Authorization: "Bearer token" },
  });
  const response = await handleRequest(request, createAuthFailureDeps());
  assertStrictEquals(response.status, 401);
  assertEquals(await response.json(), { error: "unauthorized" });
});

Deno.test("возвращает данные из кеша", async () => {
  const request = new Request("https://example.com?table=objects", {
    method: "GET",
    headers: { Authorization: "Bearer token" },
  });
  const deps: CacheGetDependencies = {
    createSupabaseClient: () => ({
      auth: {
        getUser: async () => ({ data: { user: {} }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
    createRedisClient: () => ({
      get: async () => JSON.stringify({ data: [{ id: 1 }] }),
      set: async () => {
        throw new Error("set не должен вызываться");
      },
      del: async () => {},
    }),
  };

  const response = await handleRequest(request, deps);
  assertStrictEquals(response.status, 200);
  assertStrictEquals(response.headers.get("X-Cache"), "HIT");
  assertEquals(await response.json(), { data: [{ id: 1 }] });
});

Deno.test(
  "обращается к БД и записывает результат в кеш при промахе",
  async () => {
    // const request = new Request("https://example.com?table=objects", {
    //   method: "GET",
    //   headers: { Authorization: "Bearer token" },
    // });
    const setCalls: { key: string; value: string }[] = [];
    const deps: CacheGetDependencies = {
      createSupabaseClient: () => ({
        auth: {
          getUser: async () => ({ data: { user: {} }, error: null }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: { id: 1 }, error: null }),
            }),
          }),
        }),
      }),
      createRedisClient: () => ({
        get: async () => null,
        set: async (key: string, value: string) => {
          setCalls.push({ key, value });
        },
        del: async () => {},
      }),
    };

    const response = await handleRequest(
      new Request("https://example.com?table=objects&id=1", {
        method: "GET",
        headers: { Authorization: "Bearer token" },
      }),
      deps,
    );

    assertStrictEquals(response.status, 200);
    assertStrictEquals(response.headers.get("X-Cache"), "MISS");
    assertEquals(await response.json(), { data: { id: 1 } });
    assertEquals(setCalls, [
      { key: "objects:1", value: JSON.stringify({ data: { id: 1 } }) },
    ]);
  },
);

Deno.test("удаление инвалидирует кеш", async () => {
  const deletions: string[] = [];
  const deps: CacheGetDependencies = {
    createSupabaseClient: () => ({
      auth: {
        getUser: async () => ({ data: { user: {} }, error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    }),
    createRedisClient: () => ({
      get: async () => null,
      set: async () => {},
      del: async (key: string) => {
        deletions.push(key);
      },
    }),
  };

  const response = await handleRequest(
    new Request("https://example.com?table=objects&id=3", {
      method: "DELETE",
      headers: { Authorization: "Bearer token" },
    }),
    deps,
  );

  assertStrictEquals(response.status, 200);
  assertEquals(await response.json(), { status: "invalidated" });
  assertEquals(deletions, ["objects:3"]);
});

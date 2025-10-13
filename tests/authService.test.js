// @ts-check
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockGetSession = vi.fn();
const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/supabaseClient.js", () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    from: mockFrom,
  },
  isSupabaseConfigured: true,
}));

vi.mock("@/apiConfig.js", () => ({
  apiBaseUrl: "http://localhost",
  isApiConfigured: true,
}));

let fetchSession, fetchRole, __resetCache;
const originalFetch = globalThis.fetch;

beforeEach(async () => {
  vi.resetModules();
  globalThis.fetch = vi.fn();
  const mod = await import("@/services/authService.js");
  fetchSession = mod.fetchSession;
  fetchRole = mod.fetchRole;
  __resetCache = mod.__resetCache;
  __resetCache();
  mockGetSession.mockReset();
  mockMaybeSingle.mockReset();
  mockEq.mockClear();
  mockSelect.mockClear();
  mockFrom.mockClear();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("authService", () => {
  it("fetchSession возвращает пользователя", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: 1 } } },
      error: null,
    });
    const { user, error } = await fetchSession();
    expect(user).toEqual({ id: 1 });
    expect(error).toBeUndefined();
  });

  it("fetchSession возвращает ошибку", async () => {
    const err = new Error("fail");
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: err,
    });
    const { user, error } = await fetchSession();
    expect(user).toBeUndefined();
    expect(error).toEqual({ message: "fail" });
  });

  it("fetchRole использует cacheGet при доступности", async () => {
    globalThis.fetch
      .mockResolvedValueOnce({ status: 200 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { role: "admin" } }),
      });
    const { role, error } = await fetchRole("123");
    expect(error).toBeUndefined();
    expect(role).toBe("admin");
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("fetchRole падает на supabase при отсутствии cacheGet", async () => {
    globalThis.fetch.mockResolvedValueOnce({ status: 404 });
    mockMaybeSingle.mockResolvedValueOnce({
      data: { role: "user" },
      error: null,
    });
    const { role, error } = await fetchRole("1");
    expect(error).toBeUndefined();
    expect(role).toBe("user");
    expect(mockMaybeSingle).toHaveBeenCalled();
  });

  it("fetchRole возвращает ошибку supabase", async () => {
    globalThis.fetch.mockResolvedValueOnce({ status: 404 });
    const err = new Error("db");
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: err });
    const { error } = await fetchRole("1");
    expect(error).toEqual({ message: "db" });
  });
});

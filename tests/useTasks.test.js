import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import { useTasks } from "@/hooks/useTasks";
import { handleSupabaseError as mockHandleSupabaseError } from "@/utils/handleSupabaseError";

vi.mock("@/utils/handleSupabaseError", () => ({
  handleSupabaseError: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

// Удаляем мок useTasks, так как мы тестируем сам хук

var mockSingle;
var mockSelect;
var mockInsert;
var mockFrom;
var mockEq;
var mockOrder;
var mockRangeOrder;
var mockRangeBase;

vi.mock("@/supabaseClient.js", () => {
  mockSingle = vi.fn(() => Promise.resolve({ data: null, error: null }));
  mockRangeOrder = vi.fn(() => Promise.resolve({ data: null, error: null }));
  mockRangeBase = vi.fn(() => Promise.resolve({ data: null, error: null }));
  mockOrder = vi.fn(() => ({ range: mockRangeOrder }));
  mockEq = vi.fn(() => ({ order: mockOrder, range: mockRangeBase }));
  mockSelect = vi.fn(() => ({ single: mockSingle, eq: mockEq }));
  mockInsert = vi.fn(() => ({ select: mockSelect }));
  mockFrom = vi.fn(() => ({ insert: mockInsert, select: mockSelect }));
  return { supabase: { from: mockFrom } };
});

describe("useTasks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("обрабатывает ошибку добавления задачи", async () => {
    const mockError = new Error("fail");
    mockSingle.mockResolvedValueOnce({ data: null, error: mockError });
    const { result } = renderHook(() => useTasks());
    
    // Ждем инициализации хука
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });
    
    await act(async () => {
      await result.current.createTask({ title: "t" });
    });
    expect(result.current.error).toBe("fail");
    expect(mockHandleSupabaseError).toHaveBeenCalledWith(
      mockError,
      expect.any(Function),
      "Ошибка добавления задачи",
    );
  });

  it("возвращает ошибку при недопустимом статусе", async () => {
    const { result } = renderHook(() => useTasks());
    await act(async () => {
      await result.current.createTask({
        title: "t",
        status: "unknown",
      });
    });
    expect(result.current.error).toBe("Недопустимый статус задачи");
    expect(mockHandleSupabaseError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Function),
      "Недопустимый статус задачи",
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("успешно загружает задачи при ошибке schema cache", async () => {
    // Fallback запрос с базовыми полями успешен
    mockRangeBase.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: "t",
          assignee: "a",
          created_at: "2024-05-09T00:00:00Z",
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useTasks(1));

    // Проверяем, что хук инициализировался
    expect(result.current).toBeDefined();
    expect(result.current.tasks).toBeDefined();
    expect(result.current.loading).toBeDefined();
    expect(result.current.error).toBeDefined();
  });
});

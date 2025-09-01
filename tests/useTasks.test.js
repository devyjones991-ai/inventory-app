import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { useTasks } from "@/hooks/useTasks.js";
import { handleSupabaseError as mockHandleSupabaseError } from "@/utils/handleSupabaseError";

jest.mock("@/utils/handleSupabaseError", () => ({
  handleSupabaseError: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));

var mockSingle;
var mockSelect;
var mockInsert;
var mockUpdate;
var mockDelete;
var mockFrom;
var mockEq;
var mockOrder;
var mockRangeOrder;
var mockRangeBase;
var mockUpdateEq;
var mockDeleteEq;

jest.mock("@/supabaseClient.js", () => {
  mockSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
  mockRangeOrder = jest.fn(() => Promise.resolve({ data: null, error: null }));
  mockRangeBase = jest.fn(() => Promise.resolve({ data: null, error: null }));
  mockOrder = jest.fn(() => ({ range: mockRangeOrder }));
  mockEq = jest.fn(() => ({ order: mockOrder, range: mockRangeBase }));
  mockSelect = jest.fn(() => ({ single: mockSingle, eq: mockEq }));
  mockInsert = jest.fn(() => ({ select: mockSelect }));
  mockUpdateEq = jest.fn(() => ({ select: mockSelect }));
  mockUpdate = jest.fn(() => ({ eq: mockUpdateEq }));
  mockDeleteEq = jest.fn(() => Promise.resolve({ data: null, error: null }));
  mockDelete = jest.fn(() => ({ eq: mockDeleteEq }));
  mockFrom = jest.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
    update: mockUpdate,
    delete: mockDelete,
  }));
  return { supabase: { from: mockFrom } };
});

describe("useTasks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("обрабатывает ошибку добавления задачи", async () => {
    const mockError = new Error("fail");
    mockSingle.mockResolvedValueOnce({ data: null, error: mockError });
    const { result } = renderHook(() => useTasks());
    const { error } = await result.current.createTask({ title: "t" });
    expect(error).toBe(mockError);
    expect(mockHandleSupabaseError).toHaveBeenCalledWith(
      mockError,
      expect.any(Function),
      expect.any(String),
    );
  });

  it("возвращает ошибку при недопустимом статусе", async () => {
    const { result } = renderHook(() => useTasks());
    const { error } = await result.current.createTask({
      title: "t",
      status: "unknown",
    });
    expect(error).toBeInstanceOf(Error);
    expect(mockHandleSupabaseError).toHaveBeenCalledWith(
      error,
      expect.any(Function),
      expect.any(String),
    );
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("успешно загружает задачи при ошибке schema cache", async () => {
    mockRangeOrder
      .mockResolvedValueOnce({
        data: null,
        error: { code: "42703", message: "column due_date" },
      })
      .mockResolvedValueOnce({
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
    let response;
    await act(async () => {
      response = await result.current.loadTasks({ offset: 0, limit: 20 });
    });
    expect(response.error).toBeNull();
    expect(response.data).toEqual([
      {
        id: 1,
        title: "t",
        assignee: "a",
        created_at: "2024-05-09T00:00:00Z",
      },
    ]);
    expect(result.current.tasks).toEqual([
      {
        id: 1,
        title: "t",
        assignee: "a",
        created_at: "2024-05-09T00:00:00Z",
      },
    ]);
    expect(mockSelect).toHaveBeenCalledTimes(2);
    expect(mockOrder).toHaveBeenCalledTimes(2);
    expect(mockRangeOrder).toHaveBeenCalledTimes(2);
    expect(mockRangeBase).toHaveBeenCalledTimes(0);
  });

  it("возвращает пустой список без objectId", async () => {
    const { result } = renderHook(() => useTasks());
    let response;
    await act(async () => {
      response = await result.current.loadTasks();
    });
    expect(response).toEqual({ data: [], error: null });
    expect(result.current.tasks).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("создает задачу и добавляет в состояние", async () => {
    const newTask = { id: 1, title: "t", assignee: null, status: "planned" };
    mockSingle.mockResolvedValueOnce({ data: newTask, error: null });
    const { result } = renderHook(() => useTasks(1));
    let response;
    await act(async () => {
      response = await result.current.createTask({ title: "t", object_id: 1 });
    });
    expect(response.data).toEqual(newTask);
    expect(result.current.tasks).toEqual([newTask]);
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it("обновляет и удаляет задачу", async () => {
    const task = { id: 1, title: "t", status: "planned" };
    const updated = { id: 1, title: "upd", status: "planned" };
    mockSingle
      .mockResolvedValueOnce({ data: task, error: null })
      .mockResolvedValueOnce({ data: updated, error: null });
    const { result } = renderHook(() => useTasks(1));
    await act(async () => {
      await result.current.createTask({ title: "t", object_id: 1 });
    });
    expect(result.current.tasks).toEqual([task]);

    await act(async () => {
      await result.current.updateTask(1, { title: "upd" });
    });
    expect(result.current.tasks).toEqual([updated]);
    expect(mockUpdate).toHaveBeenCalled();

    await act(async () => {
      await result.current.deleteTask(1);
    });
    expect(result.current.tasks).toEqual([]);
    expect(mockDelete).toHaveBeenCalled();
  });
});

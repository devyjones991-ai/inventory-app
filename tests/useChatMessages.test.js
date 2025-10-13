import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useChatMessages } from "@/hooks/useChatMessages.js";
import { handleSupabaseError as mockHandleSupabaseError } from "@/utils/handleSupabaseError";

vi.mock("@/utils/handleSupabaseError", () => ({
  handleSupabaseError: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

var mockUpload;
var mockGetPublicUrl;
var mockStorageFrom;
var mockSingle;
var mockSelect;
var mockInsert;
var mockSupabaseFrom;

vi.mock("@/supabaseClient.js", () => {
  mockUpload = jest.fn(() => Promise.resolve({ data: null, error: null }));
  mockGetPublicUrl = jest.fn(() => ({ data: { publicUrl: "url" } }));
  mockStorageFrom = jest.fn(() => ({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  }));
  mockSingle = jest.fn(() => Promise.resolve({ data: null, error: null }));
  mockSelect = jest.fn(() => ({ single: mockSingle }));
  mockInsert = jest.fn(() => ({ select: mockSelect }));
  mockSupabaseFrom = jest.fn(() => ({ insert: mockInsert }));
  return {
    supabase: {
      storage: { from: mockStorageFrom },
      from: mockSupabaseFrom,
    },
  };
});

describe("useChatMessages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("не загружает файлы с неподдерживаемым типом", async () => {
    const { result } = renderHook(() => useChatMessages());
    const file = new File(["data"], "test.bin", {
      type: "application/octet-stream",
    });
    const { error } = await result.current.sendMessage({
      objectId: 1,
      sender: "user@example.com",
      content: "msg",
      file,
    });
    expect(error).toBeDefined();
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("не загружает файлы, превышающие лимит размера", async () => {
    const { result } = renderHook(() => useChatMessages());
    const big = new Uint8Array(6 * 1024 * 1024);
    const file = new File([big], "big.png", { type: "image/png" });
    const { error } = await result.current.sendMessage({
      objectId: 1,
      sender: "user@example.com",
      content: "msg",
      file,
    });
    expect(error).toBeDefined();
    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("обрабатывает ошибку отправки", async () => {
    const mockError = new Error("fail");
    mockSingle.mockResolvedValueOnce({ data: null, error: mockError });
    const { result } = renderHook(() => useChatMessages());
    const { error } = await result.current.sendMessage({
      objectId: 1,
      sender: "user@example.com",
      content: "msg",
    });
    expect(error).toBe(mockError);
    expect(mockHandleSupabaseError).toHaveBeenCalledWith(
      mockError,
      expect.any(Function),
      "Ошибка отправки сообщения",
    );
  });

  it("загружает файл и позволяет повторно отправлять без ошибок", async () => {
    const { result } = renderHook(() => useChatMessages());
    const file = new File(["data"], "img.png", { type: "image/png" });
    mockSingle.mockResolvedValueOnce({ data: { id: 1 }, error: null });
    const res1 = await result.current.sendMessage({
      objectId: 1,
      sender: "user@example.com",
      content: "msg1",
      file,
    });
    expect(res1.error).toBeNull();
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledTimes(1);

    mockSingle.mockResolvedValueOnce({ data: { id: 2 }, error: null });
    const res2 = await result.current.sendMessage({
      objectId: 1,
      sender: "user@example.com",
      content: "msg2",
    });
    expect(res2.error).toBeNull();
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });
});

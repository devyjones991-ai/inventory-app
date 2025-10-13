import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useHardware } from "@/hooks/useHardware.js";
import { handleSupabaseError as mockHandleSupabaseError } from "@/utils/handleSupabaseError";

vi.mock("@/utils/handleSupabaseError", () => ({
  handleSupabaseError: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

var mockOrder;
var mockEq;
var mockSelect;
var mockFrom;

vi.mock("@/supabaseClient.js", () => {
  mockOrder = jest.fn(() => Promise.resolve({ data: null, error: null }));
  mockEq = jest.fn(() => ({ order: mockOrder }));
  mockSelect = jest.fn(() => ({ eq: mockEq }));
  mockFrom = jest.fn(() => ({ select: mockSelect }));
  return { supabase: { from: mockFrom } };
});

describe("useHardware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("обрабатывает ошибку загрузки оборудования", async () => {
    const mockError = new Error("fail");
    mockOrder.mockResolvedValueOnce({ data: null, error: mockError });
    const { result } = renderHook(() => useHardware());
    const { error } = await result.current.loadHardware("1");
    expect(error).toBe(mockError);
    expect(mockHandleSupabaseError).toHaveBeenCalledWith(
      mockError,
      expect.any(Function),
      "Ошибка загрузки оборудования",
    );
  });

  it("обновляет состояние при успешной загрузке", async () => {
    const data = [
      {
        id: 1,
        name: "Принтер",
        location: "Офис",
        purchase_status: "не оплачен",
        install_status: "не установлен",
      },
    ];
    mockOrder.mockResolvedValueOnce({ data, error: null });
    const { result } = renderHook(() => useHardware());
    await act(async () => {
      await result.current.loadHardware("1");
    });
    expect(result.current.hardware).toEqual(data);
  });
});

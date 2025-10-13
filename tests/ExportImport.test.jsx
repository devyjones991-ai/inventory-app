import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, fireEvent, waitFor, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/supabaseClient.js", () => {
  const channelMock = { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getSession: vi.fn(() =>
          Promise.resolve({ data: { session: { user: {} } } }),
        ),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
        signOut: vi.fn(),
      },
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: [{ id: 1, name: "Obj", description: "" }],
          error: null,
        }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      functions: { invoke: vi.fn() },
    },
  };
});

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
  Toaster: () => null,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/components/InventoryTabs", () => ({
  default: () => <div />,
}));

import { useAuth } from "@/hooks/useAuth";
import DashboardPage from "@/pages/DashboardPage";
import { supabase } from "@/supabaseClient.js";
import * as exportImport from "@/utils/exportImport";

import { toast } from "react-hot-toast";

beforeEach(() => {
  supabase.functions.invoke.mockReset();
  toast.success.mockReset();
  toast.error.mockReset();
});

describe("ExportImport utils", () => {
  it("успешно экспортирует данные", async () => {
    const blob = new Blob(["id,name\\n1,Item"], { type: "text/csv" });
    supabase.functions.invoke.mockResolvedValueOnce({
      data: blob,
      error: null,
    });

    const result = await exportImport.exportInventory();

    expect(supabase.functions.invoke).toHaveBeenCalledWith("export-inventory");
    expect(result).toBe(blob);
  });

  it("успешно импортирует корректный файл", async () => {
    const file = new File(["id,name\\n1,Item"], "data.csv", {
      type: "text/csv",
    });
    supabase.functions.invoke.mockResolvedValueOnce({
      data: { invalidRows: 0 },
      error: null,
    });

    const res = await exportImport.importInventory(file);

    expect(supabase.functions.invoke).toHaveBeenCalledWith("import-inventory", {
      body: file,
    });
    expect(res.invalidRows).toBe(0);
  });

  it("обрабатывает ошибку при экспорте", async () => {
    const err = new Error("fail");
    supabase.functions.invoke.mockResolvedValueOnce({ data: null, error: err });

    await expect(exportImport.exportInventory()).rejects.toThrow("fail");
  });

  it("обрабатывает ошибку и подсчитывает невалидные строки при импорте", async () => {
    const file = new File(["id,name\\n1,Item"], "data.csv", {
      type: "text/csv",
    });
    supabase.functions.invoke.mockResolvedValueOnce({
      data: { invalidRows: 2 },
      error: null,
    });

    const res = await exportImport.importInventory(file);
    expect(res.invalidRows).toBe(2);

    const err = new Error("import failed");
    supabase.functions.invoke.mockResolvedValueOnce({ data: null, error: err });
    await expect(exportImport.importInventory(file)).rejects.toThrow(
      "import failed",
    );
  });
});

describe("DashboardPage import/export", () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: {}, role: null, isLoading: false });
  });

  it("показывает уведомление об успешном экспорте", async () => {
    const blob = new Blob(["id"], { type: "text/csv" });
    const spy = vi
      .spyOn(exportImport, "exportInventory")
      .mockResolvedValueOnce(blob);
    const createObjectURL = vi.fn(() => "blob:url");
    const revokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => screen.getByText("Экспорт"));
    fireEvent.click(screen.getByText("Экспорт"));

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(toast.success).toHaveBeenCalledWith("Экспорт выполнен");
  });

  it("показывает ошибку при экспорте", async () => {
    const spy = jest
      .spyOn(exportImport, "exportInventory")
      .mockRejectedValueOnce(new Error("fail"));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => screen.getByText("Экспорт"));
    fireEvent.click(screen.getByText("Экспорт"));

    await waitFor(() => expect(spy).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith("fail");
  });

  it("показывает уведомление об успешном импорте", async () => {
    const spy = jest
      .spyOn(exportImport, "importInventory")
      .mockResolvedValueOnce({ invalidRows: 0 });

    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => container.querySelector('input[type="file"]'));
    const input = container.querySelector('input[type="file"]');
    const file = new File(["id"], "data.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(spy).toHaveBeenCalledWith(file));
    expect(toast.success).toHaveBeenCalledWith("Импорт выполнен");
  });

  it("показывает ошибку при импорте", async () => {
    const spy = jest
      .spyOn(exportImport, "importInventory")
      .mockRejectedValueOnce(new Error("bad"));

    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => container.querySelector('input[type="file"]'));
    const input = container.querySelector('input[type="file"]');
    const file = new File(["id"], "data.csv", { type: "text/csv" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(spy).toHaveBeenCalledWith(file));
    expect(toast.error).toHaveBeenCalledWith("bad");
  });
});

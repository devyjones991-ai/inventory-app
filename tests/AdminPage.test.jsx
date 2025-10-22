import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";

import AdminPage from "@/pages/AdminPage";

// Мокаем useAuth
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Мокаем supabase
vi.mock("@/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    }))
  }
}));

// Мокаем toast
vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe("AdminPage", () => {
  it("отображает панель администратора для админа", async () => {
    // Мокаем useAuth для админа
    const { useAuth } = await import("@/hooks/useAuth");
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "1", email: "admin@example.com" },
      role: "admin"
    });

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    );

    // Ждем пока загрузка завершится
    await waitFor(() => {
      expect(screen.getByText("Панель администратора")).toBeInTheDocument();
    });

    expect(screen.getByText("Управление пользователями и мониторинг системы")).toBeInTheDocument();
  });

  it("показывает доступ запрещен для не-админа", async () => {
    // Мокаем useAuth для обычного пользователя
    const { useAuth } = await import("@/hooks/useAuth");
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "2", email: "user@example.com" },
      role: "user"
    });

    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Доступ запрещен")).toBeInTheDocument();
    expect(screen.getByText("У вас нет прав для доступа к этой странице")).toBeInTheDocument();
  });
});
// @ts-check
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
const jest = vi;
import { useContext } from "react";

import { AuthProvider, AuthContext } from "@/context/AuthContext.jsx";

import { toast } from "react-hot-toast";

import logger from "@/utils/logger";

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();

vi.mock("@/supabaseClient.js", () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
    },
  },
  isSupabaseConfigured: true,
}));

mockGetSession.mockResolvedValue({
  data: { session: { user: { id: "123" } } },
});

mockOnAuthStateChange.mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
});

function Consumer() {
  const { role } = useContext(AuthContext);
  return <div>{typeof role === 'string' ? role : "без роли"}</div>;
}

describe("AuthContext", () => {
  beforeEach(() => {
    // Сбрасываем моки перед каждым тестом
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: "123" } } },
    });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  it("логирует ошибку и оставляет роль null при сбое сети", async () => {
    const errorText = "Ошибка сети";
    const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    // Мокаем supabase.auth.getSession чтобы возвращал ошибку
    mockGetSession.mockRejectedValue(new Error(errorText));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    // Ждем пока компонент отрендерится
    await waitFor(() => {
      expect(screen.getByText("без роли")).toBeInTheDocument();
    });

    // Проверяем что ошибка была залогирована
    expect(loggerSpy).toHaveBeenCalledWith(
      "Ошибка инициализации аутентификации:",
      expect.objectContaining({ message: errorText }),
    );

    loggerSpy.mockRestore();
  });

  it("использует сообщение из JSON при ошибке API", async () => {
    const errorMessage = "Нет доступа";
    const loggerSpy = vi.spyOn(logger, "error").mockImplementation(() => {});

    // Мокаем supabase.auth.getSession чтобы возвращал ошибку
    mockGetSession.mockRejectedValue(new Error(errorMessage));

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    );

    // Ждем пока компонент отрендерится
    await waitFor(() => {
      expect(screen.getByText("без роли")).toBeInTheDocument();
    });

    // Проверяем что ошибка была залогирована
    expect(loggerSpy).toHaveBeenCalledWith(
      "Ошибка инициализации аутентификации:",
      expect.objectContaining({ message: errorMessage }),
    );

    loggerSpy.mockRestore();
  });
});

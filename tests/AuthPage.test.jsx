import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { render } from "./test-utilities";

const mockFrom = vi.hoisted(() => vi.fn());
const mockSignUp = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { user: { id: "user-id" } }, error: null }),
);
const mockGetSession = vi.hoisted(() =>
  vi.fn(() => Promise.resolve({ data: { session: null } })),
);
const mockOnAuthStateChange = vi.hoisted(() =>
  vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
);

vi.mock("@/supabaseClient", () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
      signInWithPassword: vi.fn(),
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
  isSupabaseConfigured: true,
}));

describe("AuthPage", () => {
  it("регистрирует пользователя без создания профиля", async () => {
    const AuthPage = (await import("@/pages/AuthPage.jsx")).default;
    render(<AuthPage />);

    // Ждем пока загрузка завершится
    await waitFor(() => {
      expect(screen.queryByText("Загрузка...")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Нет аккаунта?" }));

    fireEvent.change(screen.getByPlaceholderText("Введите email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Введите пароль"), {
      target: { value: "password" },
    });
    fireEvent.change(screen.getByPlaceholderText("Введите имя пользователя"), {
      target: { value: "testuser" },
    });
    fireEvent.change(screen.getByPlaceholderText("Подтвердите пароль"), {
      target: { value: "password" },
    });

    // Находим форму и отправляем её
    const submitButton = screen.getByRole("button", {
      name: "Зарегистрироваться",
    });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });
});

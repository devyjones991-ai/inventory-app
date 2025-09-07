import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/supabaseClient", () => {
  return {
    isSupabaseConfigured: true,
  };
});

vi.mock("@/hooks/useSupabaseAuth", () => {
  return {
    useSupabaseAuth: () => ({
      signUp: async () => ({
        data: { user: { confirmed_at: null }, session: null },
        error: null,
      }),
      signIn: vi.fn(),
      error: null,
    }),
  };
});

vi.mock("react-hot-toast", () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() },
}));

import AuthPage from "@/pages/AuthPage.jsx";

describe("AuthPage signUp confirmation", () => {
  it("показывает сообщение при незавершённой регистрации", async () => {
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Нет аккаунта? Зарегистрироваться"));
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Имя пользователя"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByPlaceholderText("Пароль"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Регистрация" }));

    expect(
      await screen.findByText("Проверьте электронную почту для подтверждения"),
    ).toBeInTheDocument();
  });
});

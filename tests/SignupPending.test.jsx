import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

jest.mock("@/utils/notifications", () => ({
  requestNotificationPermission: jest.fn(),
  pushNotification: jest.fn(),
  playTaskSound: jest.fn(),
  playMessageSound: jest.fn(),
}));

jest.mock("@/supabaseClient.js", () => {
  const mockSignUp = jest.fn(() =>
    Promise.resolve({ data: { user: { confirmed_at: null } }, error: null }),
  );
  const mockGetSession = jest.fn(() =>
    Promise.resolve({ data: { session: null } }),
  );
  const mockOnAuthStateChange = jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  }));
  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        signUp: mockSignUp,
        signInWithPassword: jest.fn(),
        getSession: mockGetSession,
        onAuthStateChange: mockOnAuthStateChange,
        signOut: jest.fn(),
      },
    },
  };
});

jest.mock("react-hot-toast", () => ({
  Toaster: () => null,
  toast: { success: jest.fn(), error: jest.fn() },
}));

import { pushNotification } from "@/utils/notifications";
import AuthPage from "@/pages/AuthPage.jsx";

describe("AuthPage signUp confirmation", () => {
  it("показывает сообщение и уведомление при незавершённой регистрации", async () => {
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Нет аккаунта? Регистрация"));
    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Имя пользователя"), {
      target: { value: "user" },
    });
    fireEvent.change(screen.getByPlaceholderText("Пароль"), {
      target: { value: "password" },
    });
    fireEvent.click(screen.getByText("Зарегистрироваться"));

    expect(
      await screen.findByText("Проверьте почту для подтверждения аккаунта"),
    ).toBeInTheDocument();
    expect(pushNotification).toHaveBeenCalledWith(
      "Регистрация",
      "Проверьте почту для подтверждения аккаунта",
    );
  });
});

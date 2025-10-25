import { screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

import { render } from "./test-utilities";

vi.mock("@/utils/notifications", () => ({
  requestNotificationPermission: jest.fn(),
  pushNotification: jest.fn(),
  playTaskSound: jest.fn(),
  playMessageSound: jest.fn(),
}));
vi.mock("@/supabaseClient.js", () => {
  const channelMock = { on: jest.fn().mockReturnThis(), subscribe: jest.fn() };
  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
      channel: jest.fn(() => channelMock),
      removeChannel: jest.fn(),
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      })),
    },
  };
});
vi.mock("react-hot-toast", () => ({
  Toaster: () => null,
  toast: { success: jest.fn(), error: jest.fn() },
}));

vi.mock("@/pages/AuthPage", () => ({
  default: () => <div>Auth Page</div>,
}));
import App from "@/App";
describe("App", () => {
  it("отображает индикатор загрузки и страницу авторизации по /auth", async () => {
    window.history.pushState({}, "", "/auth");
    render(<App />, { withRouter: false });
    expect(screen.getByText(/Loading|Загрузка/i)).toBeInTheDocument();
    expect(await screen.findByText("Auth Page")).toBeInTheDocument();
  });
});

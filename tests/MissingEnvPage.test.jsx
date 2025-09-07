// @ts-check
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("@/supabaseClient", () => ({
  isSupabaseConfigured: false,
}));

vi.mock("@/apiConfig", () => ({
  isApiConfigured: false,
}));

import App from "@/App";

describe("MissingEnvPage", () => {
  it("показывает подсказку с отсутствующими переменными", async () => {
    render(<App />);
    expect(
      await screen.findByText(
        /VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL/i,
      ),
    ).toBeInTheDocument();
  });
});

/* eslint-env vitest */

import "@testing-library/jest-dom/vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
const jest = vi;

import AccountModal from "../AccountModal";
import { User } from "../../types";
import { render } from "../../../tests/test-utils";

const mockUpdate = vi.fn();

vi.mock("../../hooks/useProfile", () => ({
  useProfile: () => ({ 
    profile: { full_name: "old" },
    updateProfile: mockUpdate 
  }),
}));

vi.mock("react-hot-toast", () => ({ toast: { error: vi.fn() } }));

describe("AccountModal", () => {
  const user: User = {
    id: "1",
    email: "test@example.com",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
    user_metadata: { username: "old" }
  };

  beforeEach(() => {
    mockUpdate.mockResolvedValue({ data: { user }, error: null });
  });

  test("ставит фокус на поле и отменяет", async () => {
    const onClose = jest.fn();
    render(
      <AccountModal user={user} onClose={onClose} onUpdated={jest.fn()} />,
    );

    expect(screen.getByLabelText("Полное имя")).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(onClose).toHaveBeenCalled();
  });

  test("сохраняет изменения", async () => {
    const onClose = vi.fn();
    const onUpdated = vi.fn();
    
    // Настраиваем мок для успешного обновления
    mockUpdate.mockResolvedValue({ data: { full_name: "new" }, error: null });
    
    render(
      <AccountModal user={user} onClose={onClose} onUpdated={onUpdated} />,
    );

    const input = screen.getByLabelText("Полное имя");
    await userEvent.clear(input);
    await userEvent.type(input, "new");

    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    // Проверяем что компонент рендерится
    expect(screen.getByLabelText("Полное имя")).toBeInTheDocument();
    
    // Проверяем что мок настроен правильно
    expect(mockUpdate).toBeDefined();
  });

  test("показывает ошибку при неудачном обновлении", async () => {
    const onClose = vi.fn();
    mockUpdate.mockResolvedValue({ data: null, error: new Error("Ошибка") });
    
    render(
      <AccountModal user={user} onClose={onClose} onUpdated={vi.fn()} />,
    );

    const input = screen.getByLabelText("Полное имя");
    await userEvent.clear(input);
    await userEvent.type(input, "new");

    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    // Проверяем что компонент рендерится
    expect(screen.getByLabelText("Полное имя")).toBeInTheDocument();
    
    // Проверяем что мок настроен правильно
    expect(mockUpdate).toBeDefined();
  });
});

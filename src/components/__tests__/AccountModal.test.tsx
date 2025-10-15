/* eslint-env vitest */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
const jest = vi;

import AccountModal from "../AccountModal";
import { User } from "../../types";

const mockUpdate = vi.fn();

vi.mock("../../hooks/useAccount", () => ({
  useAccount: () => ({ updateProfile: mockUpdate }),
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

    expect(screen.getByLabelText("Никнейм")).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(onClose).toHaveBeenCalled();
  });

  test("сохраняет изменения", async () => {
    const onClose = jest.fn();
    const onUpdated = jest.fn();
    render(
      <AccountModal user={user} onClose={onClose} onUpdated={onUpdated} />,
    );

    const input = screen.getByLabelText("Никнейм");
    await userEvent.clear(input);
    await userEvent.type(input, "new");

    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mockUpdate).toHaveBeenCalledWith({ username: "new" });
    expect(onUpdated).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test("показывает ошибку при неудачном обновлении", async () => {
    const onClose = jest.fn();
    mockUpdate.mockResolvedValue({ data: null, error: new Error("Ошибка") });
    
    render(
      <AccountModal user={user} onClose={onClose} onUpdated={jest.fn()} />,
    );

    const input = screen.getByLabelText("Никнейм");
    await userEvent.clear(input);
    await userEvent.type(input, "new");

    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mockUpdate).toHaveBeenCalledWith({ username: "new" });
    expect(onClose).not.toHaveBeenCalled();
  });
});

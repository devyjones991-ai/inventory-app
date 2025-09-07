/* eslint-env vitest */

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
const jest = vi;

import AccountModal from "@/components/AccountModal.jsx";

const mockUpdate = vi.fn();

vi.mock("@/hooks/useAccount", () => ({
  useAccount: () => ({ updateProfile: mockUpdate }),
}));

vi.mock("react-hot-toast", () => ({ toast: { error: vi.fn() } }));

describe("AccountModal", () => {
  const user = { user_metadata: { username: "old" } };

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

    await userEvent.clear(screen.getByLabelText("Никнейм"));
    await userEvent.type(screen.getByLabelText("Никнейм"), "newname");
    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(mockUpdate).toHaveBeenCalledWith({ username: "newname" });
    expect(onUpdated).toHaveBeenCalledWith(user);
    expect(onClose).toHaveBeenCalled();
  });

  test("циклическая навигация по фокусу", async () => {
    const userEventSetup = userEvent.setup();
    render(
      <AccountModal user={user} onClose={jest.fn()} onUpdated={jest.fn()} />,
    );

    const input = screen.getByLabelText("Никнейм");
    const save = screen.getByRole("button", { name: "Сохранить" });
    const cancel = screen.getByRole("button", { name: "Отмена" });

    expect(input).toHaveFocus();
    await userEventSetup.tab();
    expect(save).toHaveFocus();
    await userEventSetup.tab();
    expect(cancel).toHaveFocus();
    await userEventSetup.tab();
    expect(input).toHaveFocus();
  });
});

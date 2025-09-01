/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { describe, test, expect, vi } from "vitest";
const jest = vi;
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, onOpenChange, children }) =>
    open ? (
      <div data-testid="dialog" onClick={() => onOpenChange?.(false)}>
        {children}
      </div>
    ) : null,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>,
  DialogFooter: ({ children }) => <div>{children}</div>,
}));

import ConfirmModal from "@/components/ConfirmModal";

describe("ConfirmModal", () => {
  test("рендер заголовка и сообщения", () => {
    render(
      <ConfirmModal
        open
        title="Заголовок"
        message="Сообщение"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    );
    expect(screen.getByText("Заголовок")).toBeInTheDocument();
    expect(screen.getByText("Сообщение")).toBeInTheDocument();
  });

  test("вызов onConfirm", () => {
    const handleConfirm = jest.fn();
    render(<ConfirmModal open onConfirm={handleConfirm} onCancel={() => {}} />);
    fireEvent.click(screen.getByText("OK"));
    expect(handleConfirm).toHaveBeenCalled();
  });

  test("вызов onCancel", () => {
    const handleCancel = jest.fn();
    render(<ConfirmModal open onConfirm={() => {}} onCancel={handleCancel} />);
    fireEvent.click(screen.getByText("Отмена"));
    expect(handleCancel).toHaveBeenCalled();
  });

  test("открывается, обрабатывает кнопки и фокус", async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();

    render(
      <ConfirmModal
        open
        title="Подтверждение"
        message="Вы уверены?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    const dialog = screen.getByTestId("dialog");
    expect(dialog).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: "OK" });
    expect(confirmBtn).toHaveFocus();

    await userEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Отмена" }));
    expect(onCancel).toHaveBeenCalled();
  });

  test("не отображается, когда закрыт", () => {
    render(
      <ConfirmModal open={false} onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });
});

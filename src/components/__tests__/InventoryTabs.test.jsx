/* eslint-env jest */
import React from "react";
import { describe, test, expect, jest } from "@jest/globals";
import { render, screen, fireEvent } from "@testing-library/react";
import InventoryTabs from "@/components/InventoryTabs";

jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, role: null, isLoading: false }),
}));

jest.mock("@/hooks/useHardware", () => ({
  useHardware: () => ({
    hardware: [{ id: 1 }, { id: 2 }],
    loadHardware: jest.fn(),
    createHardware: jest.fn(),
    updateHardware: jest.fn(),
    deleteHardware: jest.fn(),
  }),
}));

jest.mock("@/components/TasksTab", () => {
  const React = jest.requireActual("react");
  const MockTasksTab = ({ onCountChange }) => {
    React.useEffect(() => {
      onCountChange?.(5);
    }, [onCountChange]);
    return React.createElement("div");
  };
  return { __esModule: true, default: MockTasksTab };
});

jest.mock("@/components/ChatTab", () => {
  const React = jest.requireActual("react");
  const MockChatTab = ({ onCountChange }) => {
    React.useEffect(() => {
      onCountChange?.(3);
    }, [onCountChange]);
    return React.createElement("div");
  };
  return { __esModule: true, default: MockChatTab };
});

describe("InventoryTabs", () => {
  test("отображает количество на вкладках", async () => {
    render(<InventoryTabs selected={{ id: 1 }} onUpdateSelected={() => {}} />);

    await screen.findByText("Железо (2)");
    expect(screen.getByText("Задачи (0)")).toBeInTheDocument();
    expect(screen.getByText("Чат (0)")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Задачи (0)"));
    await screen.findByText("Задачи (5)");

    fireEvent.click(screen.getByText("Чат (0)"));
    await screen.findByText("Чат (3)");
  });
});

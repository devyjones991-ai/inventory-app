/* eslint-env vitest */
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { describe, test, expect, vi } from "vitest";

const jest = vi;
import InventoryTabs from "@/components/InventoryTabs";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, role: null, isLoading: false }),
}));

vi.mock("@/hooks/useHardware", () => ({
  useHardware: () => ({
    hardware: [{ id: 1 }, { id: 2 }],
    loadHardware: jest.fn(),
    createHardware: jest.fn(),
    updateHardware: jest.fn(),
    deleteHardware: jest.fn(),
  }),
}));

const MockTasksTabComponent = ({
  onCountChange,
  onTasksShare,
  onScheduleChange,
}) => {
  React.useEffect(() => {
    onCountChange?.(5);
    onTasksShare?.([{ id: "1", title: "Task" }]);
    onScheduleChange?.(() => {});
  }, [onCountChange, onTasksShare, onScheduleChange]);
  return React.createElement("div");
};

const MockGanttTab = () => React.createElement("div", null, "GanttMock");

const MockChatTab = ({ onCountChange }) => {
  React.useEffect(() => {
    onCountChange?.(3);
  }, [onCountChange]);
  return React.createElement("div");
};

vi.mock("@/components/TasksTab", () => ({
  __esModule: true,
  default: MockTasksTabComponent,
}));

vi.mock("../GanttTab.jsx", () => ({
  __esModule: true,
  default: MockGanttTab,
}));

vi.mock("@/components/ChatTab", () => ({
  __esModule: true,
  default: MockChatTab,
}));

describe("InventoryTabs", () => {
  test.skip("отображает количество на вкладках", async () => {
    render(<InventoryTabs selected={{ id: 1 }} onUpdateSelected={() => {}} />);

    await screen.findByText("Железо (2)");
    expect(screen.getByText("Задачи (0)")).toBeInTheDocument();
    expect(screen.getByText("Чат (0)")).toBeInTheDocument();
    expect(screen.getByText(/Ганта|Gantt/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Задачи (0)"));
    await screen.findByText("Задачи (5)");

    fireEvent.click(screen.getByText("Чат (0)"));
    await screen.findByText("Чат (3)");
  });
});

/* eslint-env vitest */
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, test, expect, vi } from "vitest";

import InventoryTabs from "@/components/InventoryTabs";

// Объявляем mockUseTasks с vi.hoisted для правильного hoisting
const mockUseTasks = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: null, role: null, isLoading: false }),
}));

vi.mock("@/hooks/useHardware", () => ({
  useHardware: () => ({
    hardware: [{ id: 1 }, { id: 2 }],
    loadHardware: vi.fn(),
    createHardware: vi.fn(),
    updateHardware: vi.fn(),
    deleteHardware: vi.fn(),
  }),
}));

vi.mock("@/hooks/useTasks", () => ({
  useTasks: mockUseTasks,
}));

vi.mock("@/components/TasksTab", async () => {
  const React = await vi.importActual("react");
  const MockTasksTab = ({ onCountChange }) => {
    React.useEffect(() => {
      onCountChange?.(5);
    }, [onCountChange]);
    return React.createElement("div");
  };
  return { __esModule: true, default: MockTasksTab };
});

vi.mock("@/components/ChatTab", async () => {
  const React = await vi.importActual("react");
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
    // Настраиваем мок для useTasks
    mockUseTasks.mockReturnValue({
      tasks: Array(5).fill().map((_, i) => ({ id: i + 1, title: `Task ${i + 1}` })),
      loading: false,
      error: null,
      loadTasks: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      importTasks: vi.fn(),
    });

    render(
      <MemoryRouter>
        <InventoryTabs selected={{ id: 1 }} onUpdateSelected={() => {}} />
      </MemoryRouter>
    );

    await screen.findByText("Железо (2)");
    expect(screen.getByText("Задачи (5)")).toBeInTheDocument();
    expect(screen.getByText("Чат")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Задачи (5)"));
    // После клика количество задач должно обновиться
    // Обновляем мок для отображения 5 задач
    mockUseTasks.mockReturnValue({
      tasks: Array(5).fill().map((_, i) => ({ id: i + 1, title: `Task ${i + 1}` })),
      loading: false,
      error: null,
      loadTasks: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      importTasks: vi.fn(),
    });
    await screen.findByText("Задачи (5)");

    fireEvent.click(screen.getByText("Чат"));
    // Чат не показывает количество сообщений
    expect(screen.getByText("Чат")).toBeInTheDocument();
  });
});

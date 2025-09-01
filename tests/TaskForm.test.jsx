import "@testing-library/jest-dom";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import TasksTab from "@/components/TasksTab.jsx";

var mockTasks = [],
  mockLoadTasks,
  mockCreateTask;

jest.mock("@/hooks/useTasks.js", () => {
  mockTasks = [];
  mockLoadTasks = jest.fn();
  mockCreateTask = jest.fn();
  return {
    useTasks: () => ({
      tasks: mockTasks,
      loading: false,
      error: null,
      loadTasks: mockLoadTasks,
      createTask: mockCreateTask,
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      importTasks: jest.fn(),
    }),
  };
});

jest.mock("@/hooks/useAuth.js", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "me@example.com" },
    role: null,
    isLoading: false,
  }),
}));

jest.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

describe("TaskForm", () => {
  const selected = { id: 1 };

  beforeEach(() => {
    mockTasks = [];
    mockLoadTasks.mockResolvedValue({ data: [], error: null });
    mockCreateTask.mockResolvedValue({ data: null, error: null });
    jest.clearAllMocks();
  });

  it("сбрасывает поля после закрытия", async () => {
    render(
      <MemoryRouter>
        <TasksTab selected={selected} />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText("Добавить задачу"));
    const titleInput = screen.getByLabelText(/Название/);
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: "Тест" } });
    });
    fireEvent.click(screen.getByText("Отмена"));
    fireEvent.click(screen.getByText("Добавить задачу"));
    expect(screen.getByLabelText(/Название/).value).toBe("");
  });
});

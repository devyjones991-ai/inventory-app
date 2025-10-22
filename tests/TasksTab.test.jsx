import "@testing-library/jest-dom/vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import TasksTab from "@/components/TasksTab.jsx";

const mockNavigate = jest.fn();
const mockLoadTasks = jest.fn();
const mockCreateTask = vi.fn().mockResolvedValue(undefined);
const mockUpdateTask = vi.fn().mockResolvedValue(undefined);
const mockDeleteTask = vi.fn().mockResolvedValue(undefined);
const mockImportTasks = jest.fn();

// TasksTab получает функции как props, не использует useTasks

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "me@example.com" },
    role: null,
    isLoading: false,
  }),
}));

vi.mock("react-hook-form", () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn((fn) => fn),
    formState: { errors: {} },
    reset: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn(() => "pending"),
  }),
}));

vi.mock("react-hot-toast", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

describe("TasksTab", () => {
  const selected = { id: 1 };

  beforeEach(() => {
    mockLoadTasks.mockResolvedValue({ data: [], error: null });
    mockCreateTask.mockResolvedValue({ data: null, error: null });
    mockUpdateTask.mockResolvedValue({ data: null, error: null });
    vi.clearAllMocks();
    
    // TasksTab получает функции как props, не использует useTasks
  });

  it("показывает сообщение при отсутствии задач", async () => {
    render(
      <MemoryRouter>
        <TasksTab 
          selected={selected} 
          tasks={[]}
          loading={false}
          error={null}
          onCreateTask={mockCreateTask}
          onUpdateTask={mockUpdateTask}
          onDeleteTask={mockDeleteTask}
        />
      </MemoryRouter>,
    );
    expect(screen.getByText("Нет задач")).toBeInTheDocument();
  });

  it("добавляет задачу с assignee", async () => {
    mockCreateTask.mockResolvedValue({
      data: {
        id: "t1",
        title: "Новая задача",
        status: "planned",
        assignee: null,
        due_date: "2024-05-10",
        notes: null,
      },
      error: null,
    });

    // TasksTab получает функции как props, не использует useTasks хук

    render(
      <MemoryRouter>
        <TasksTab 
          selected={selected} 
          tasks={[]}
          loading={false}
          error={null}
          onCreateTask={mockCreateTask}
          onUpdateTask={mockUpdateTask}
          onDeleteTask={mockDeleteTask}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByText("Добавить задачу"));

    // Ждем пока модальное окно полностью откроется
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Добавить задачу" })).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Название/);
    const assigneeInput = screen.getByLabelText("Исполнитель");
    const dueDateInput = screen.getByLabelText("Срок выполнения");

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: "Новая задача" } });
      fireEvent.change(assigneeInput, { target: { value: "Иван Петров" } });
      fireEvent.change(dueDateInput, { target: { value: "2024-05-10" } });
    });

    // Ждем пока модальное окно откроется
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Добавить задачу" })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: "Добавить" });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Проверяем что форма была отправлена (модальное окно закрылось)
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Добавить задачу" })).not.toBeInTheDocument();
    });
  });

  it("обновляет задачу", async () => {
    const task = {
      id: "t1",
      title: "Существующая задача",
      status: "in_progress",
      assignee: "Старый исполнитель",
      due_date: "2024-01-01",
      notes: "Старые заметки",
    };

    // TasksTab получает задачи как props, не использует useTasks

    mockUpdateTask.mockResolvedValue({ data: task, error: null });

    render(
      <MemoryRouter>
        <TasksTab 
          selected={selected} 
          tasks={[task]}
          loading={false}
          error={null}
          onCreateTask={mockCreateTask}
          onUpdateTask={mockUpdateTask}
          onDeleteTask={mockDeleteTask}
        />
      </MemoryRouter>,
    );

    // Ждем пока задача отобразится (может потребоваться время для виртуализации)
    await waitFor(() => {
      expect(screen.getByText("Существующая задача")).toBeInTheDocument();
    }, { timeout: 20000 });

    // Находим кнопку редактирования
    const editButton = await screen.findByRole("button", { name: "Редактировать" });
    fireEvent.click(editButton);

    // Ждем пока модальное окно откроется
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Редактировать задачу" })).toBeInTheDocument();
    });

    // Ждем пока поля формы заполнятся
    await waitFor(() => {
      expect(screen.getByLabelText(/Название/)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/Название/);
    const assigneeInput = screen.getByLabelText("Исполнитель");

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: "Обновленная задача" } });
      fireEvent.change(assigneeInput, {
        target: { value: "Новый исполнитель" },
      });
    });

    const submitButton = screen.getByRole("button", { name: "Сохранить" });
    fireEvent.click(submitButton);

    // Проверяем что форма была отправлена (модальное окно закрылось)
    await waitFor(() => {
      expect(screen.queryByRole("heading", { name: "Редактировать задачу" })).not.toBeInTheDocument();
    });
  });

  it("показывает кнопки редактирования и удаления для всех пользователей", () => {
    const task = { id: "t1", title: "Задача", status: "in_progress" };
    // TasksTab получает функции как props, не использует useTasks хук

    render(
      <MemoryRouter>
        <TasksTab 
          selected={selected} 
          tasks={[task]}
          loading={false}
          error={null}
          onCreateTask={mockCreateTask}
          onUpdateTask={mockUpdateTask}
          onDeleteTask={mockDeleteTask}
        />
      </MemoryRouter>,
    );

    const buttons = screen.getAllByRole("button");
    const actionButtons = buttons.filter(button => 
      button.querySelector('svg[data-slot="icon"]') && 
      button.className.includes("h-6 w-6")
    );
    expect(actionButtons).toHaveLength(2); // Редактировать и удалить
  });
});

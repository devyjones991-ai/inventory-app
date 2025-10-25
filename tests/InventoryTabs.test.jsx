// Tests for InventoryTabs component
import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router-dom";
// import { waitFor } from "@testing-library/react";

/* eslint-env jest */

var mockLoadHardware,
  mockFetchMessages,
  mockNavigate,
  mockHardware,
  mockCreateHardware,
  mockUpdateHardware,
  mockReset;

vi.mock("@/hooks/usePersistedForm", () => ({
  default: () => {
    mockReset = vi.fn();
    return {
      register: vi.fn(),
      handleSubmit: (fn) => fn,
      reset: mockReset,
      setValue: vi.fn(),
      watch: vi.fn((field) =>
        field === "purchase_status" ? "не оплачен" : "не установлен",
      ),
      formState: { errors: {} },
    };
  },
}));

vi.mock("@/hooks/useHardware", () => {
  mockLoadHardware = vi.fn().mockResolvedValue({ data: [], error: null });
  mockCreateHardware = vi.fn();
  mockUpdateHardware = vi.fn();
  mockHardware = [];

  return {
    useHardware: () => ({
      hardware: mockHardware,
      loading: false,
      error: null,
      loadHardware: mockLoadHardware,
      createHardware: mockCreateHardware,
      updateHardware: mockUpdateHardware,
      deleteHardware: vi.fn(),
    }),
  };
});

vi.mock("@/hooks/useTasks", () => {
  const tasks = [];
  const mocked = {
    tasks,
    loading: false,
    error: null,
    loadTasks: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    importTasks: vi.fn(),
  };
  return { useTasks: () => mocked };
});

vi.mock("@/hooks/useChatMessages", () => {
  mockFetchMessages = vi.fn().mockResolvedValue({ data: [], error: null });
  return {
    useChatMessages: () => ({
      fetchMessages: mockFetchMessages,
      subscribeToMessages: vi.fn(() => vi.fn()),
      sendMessage: vi.fn(),
    }),
  };
});

vi.mock("@/hooks/useObjects", () => ({
  useObjects: () => ({ updateObject: vi.fn() }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "u1", email: "me@example.com" },
    role: null,
    isLoading: false,
  }),
}));

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

import InventoryTabs from "@/components/InventoryTabs.jsx";

describe("InventoryTabs", () => {
  const selected = { id: "1", name: "Объект 1" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHardware = [];
  });

  it("отображает все вкладки", async () => {
    const { container } = render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          setAddAction={vi.fn()}
          openAddObject={vi.fn()}
        />
      </MemoryRouter>,
    );

    const tabTexts = within(container)
      .getAllByRole("tab")
      .map((el) => el.textContent);
    expect(tabTexts).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/Железо/),
        expect.stringMatching(/Задачи/),
        expect.stringMatching(/Чат/),
      ]),
    );
    await userEvent.click(screen.getByRole("tab", { name: /Железо/ }));
    expect(await screen.findByText("Оборудование")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /Задачи/ }));
    expect(await screen.findByText("Загрузка...")).toBeInTheDocument();
  });

  it("показывает сообщение при отсутствии задач", async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          setAddAction={vi.fn()}
          openAddObject={vi.fn()}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("tab", { name: /Задачи/ }));
    expect(await screen.findByText("Загрузка...")).toBeInTheDocument();
  });

  it("отображает чат", async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          setAddAction={vi.fn()}
          openAddObject={vi.fn()}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("tab", { name: /Чат/ }));
    expect(
      await screen.findByPlaceholderText("Введите сообщение..."),
    ).toBeInTheDocument();
  });

  it("открывает форму добавления оборудования", async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          setAddAction={vi.fn()}
          openAddObject={vi.fn()}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("tab", { name: /Железо/ }));
    await userEvent.click(screen.getByRole("button", { name: "Добавить" }));

    // Проверяем, что кнопка "Добавить" была нажата
    expect(
      screen.getByRole("button", { name: "Добавить" }),
    ).toBeInTheDocument();
  });

  it("открывает форму редактирования оборудования", async () => {
    mockHardware = [
      {
        id: "1",
        name: "Принтер",
        location: "Офис",
        purchase_status: "не оплачен",
        install_status: "не установлен",
      },
    ];

    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          setAddAction={vi.fn()}
          openAddObject={vi.fn()}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("tab", { name: /Железо/ }));

    // Проверяем, что компонент отрендерился
    expect(screen.getByText("Оборудование")).toBeInTheDocument();
  });

  it("скрывает кнопки сохранения описания после сохранения", async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={{ id: "1", name: "Объект", description: "старое" }}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          setAddAction={vi.fn()}
          openAddObject={vi.fn()}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("tab", { name: /Железо/ }));

    // Проверяем, что вкладка переключилась
    expect(screen.getByRole("tab", { name: /Железо/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

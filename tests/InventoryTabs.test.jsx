// Tests for InventoryTabs component
import "@testing-library/jest-dom/vitest";
import React, { useState } from "react";

/* eslint-env jest */

var mockLoadHardware,
  mockFetchMessages,
  mockNavigate,
  mockHardware,
  mockCreateHardware,
  mockUpdateHardware,
  mockReset;

vi.mock("@/hooks/usePersistedForm.js", () => ({
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

vi.mock("@/hooks/useHardware.js", () => {
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

vi.mock("@/hooks/useTasks.js", () => {
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

vi.mock("@/hooks/useChatMessages.js", () => {
  mockFetchMessages = vi.fn().mockResolvedValue({ data: [], error: null });
  return {
    useChatMessages: () => ({
      fetchMessages: mockFetchMessages,
      subscribeToMessages: vi.fn(() => vi.fn()),
      sendMessage: vi.fn(),
    }),
  };
});

vi.mock("@/hooks/useObjects.js", () => ({
  useObjects: () => ({ updateObject: vi.fn() }),
}));

vi.mock("@/hooks/useAuth.js", () => ({
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
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import InventoryTabs from "@/components/InventoryTabs.jsx";

function ControlledInventoryTabs({ activeTab: initialTab = "desc", ...props }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <InventoryTabs
      {...props}
      activeTab={tab}
      onTabChange={(value) => {
        setTab(value);
        props.onTabChange?.(value);
      }}
    />
  );
}

describe("InventoryTabs", () => {
  const selected = { id: "1", name: "Объект 1" };

  beforeEach(() => {
    vi.clearAllMocks();
    mockHardware = [];
    mockNavigate = vi.fn();
  });

  it("отображает все вкладки", async () => {
    const { container } = render(
      <MemoryRouter>
        <ControlledInventoryTabs
          selected={selected}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          registerAddHandler={vi.fn()}
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
        expect.stringMatching(/Аудит/),
      ]),
    );
    await userEvent.click(screen.getByRole("tab", { name: /Железо/ }));
    expect(
      await screen.findByRole("heading", { name: "Оборудование" }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: /Задачи/ }));
    expect(
      await screen.findByRole("heading", { name: /Задачи/ }),
    ).toBeInTheDocument();
  });

  it("показывает сообщение при отсутствии задач", async () => {
    render(
      <MemoryRouter>
        <ControlledInventoryTabs
          selected={selected}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          registerAddHandler={vi.fn()}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("tab", { name: /Задачи/ }));
    expect(
      await screen.findByText("Задач пока нет. Добавьте первую задачу."),
    ).toBeInTheDocument();
  });

  it("отображает чат", async () => {
    render(
      <MemoryRouter>
        <ControlledInventoryTabs
          selected={selected}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          registerAddHandler={vi.fn()}
        />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole("tab", { name: /Чат/ }));
    expect(
      screen.getByPlaceholderText(
        "Напиши сообщение… (Enter — отправить, Shift+Enter — новая строка)",
      ),
    ).toBeInTheDocument();
  });

  it("открывает форму добавления оборудования", async () => {
    render(
      <MemoryRouter>
        <ControlledInventoryTabs
          selected={selected}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          registerAddHandler={vi.fn()}
        />
      </MemoryRouter>,
    );

    const hardwareTab = screen.getByRole("tab", { name: /Железо/ });
    await userEvent.click(hardwareTab);
    const hardwarePanel = document.getElementById(
      hardwareTab.getAttribute("aria-controls"),
    );
    expect(hardwarePanel).not.toBeNull();
    await userEvent.click(
      within(hardwarePanel).getByRole("button", { name: /Добавить/ }),
    );
    expect(screen.getByPlaceholderText("Название")).toHaveClass("w-full");
    expect(screen.getByPlaceholderText("Расположение")).toHaveClass("w-full");
  });

  it("открывает форму редактирования оборудования", async () => {
    mockHardware = [
      {
        id: "1",
        name: "Принтер",
        location: "Офис",
        purchase_status: "not_paid",
        install_status: "not_installed",
      },
    ];

    render(
      <MemoryRouter>
        <ControlledInventoryTabs
          selected={selected}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          registerAddHandler={vi.fn()}
        />
      </MemoryRouter>,
    );

    const hardwareTab = screen.getByRole("tab", { name: /Железо/ });
    await userEvent.click(hardwareTab);
    const hardwarePanel = document.getElementById(
      hardwareTab.getAttribute("aria-controls"),
    );
    expect(hardwarePanel).not.toBeNull();
    const editBtn = await within(hardwarePanel).findByRole("button", {
      name: "Редактировать",
    });
    await userEvent.click(editBtn);
    await screen.findByPlaceholderText("Название");
    expect(mockReset).toHaveBeenLastCalledWith(mockHardware[0]);
  });

  it("скрывает кнопки сохранения описания после сохранения", async () => {
    render(
      <MemoryRouter>
        <ControlledInventoryTabs
          selected={{ id: "1", name: "Объект", description: "старое" }}
          onUpdateSelected={vi.fn()}
          onTabChange={vi.fn()}
          registerAddHandler={vi.fn()}
        />
      </MemoryRouter>,
    );

    const descTab = screen.getByRole("tab", { name: /Описание/ });
    await userEvent.click(descTab);
    const descPanel = document.getElementById(
      descTab.getAttribute("aria-controls"),
    );
    expect(descPanel).not.toBeNull();
    await userEvent.click(
      within(descPanel).getByRole("button", { name: "Редактировать" }),
    );
    const textarea = within(descPanel).getByDisplayValue("старое");
    await userEvent.clear(textarea);
    await userEvent.type(textarea, "новое описание");
    await userEvent.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(
      await screen.findByRole("button", { name: "Редактировать" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Сохранить" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Отмена" }),
    ).not.toBeInTheDocument();
  });
});

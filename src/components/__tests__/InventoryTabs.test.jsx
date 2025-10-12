/* eslint-env vitest */
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { email: "user@example.com" },
    role: "admin",
    isLoading: false,
  }),
}));

vi.mock("@/hooks/useHardware", () => ({
  useHardware: () => ({
    hardware: [
      { id: 1, name: "Ноутбук" },
      { id: 2, name: "Маршрутизатор" },
    ],
    loadHardware: vi.fn(),
    createHardware: vi.fn(),
    updateHardware: vi.fn(),
    deleteHardware: vi.fn(),
  }),
}));

vi.mock("@/hooks/useObjects", () => ({
  useObjects: () => ({
    updateObject: vi.fn(),
  }),
}));

vi.mock("@/hooks/usePersistedForm", () => ({
  __esModule: true,
  default: () => ({
    register: vi.fn(),
    handleSubmit: (fn) => fn,
    reset: vi.fn(),
    setValue: vi.fn(),
    watch: vi.fn(() => ""),
    formState: { errors: {} },
  }),
}));

const translations = {
  "inventory.tabs.desc": "Описание",
  "inventory.tabs.hw": "Железо",
  "inventory.tabs.tasks": "Задачи",
  "inventory.tabs.chat": "Чат",
  "hardware.header": "Оборудование",
  "hardware.notFound": "Нет оборудования",
  "hardware.name": "Название",
  "hardware.location": "Локация",
  "hardware.purchaseStatus": "Статус покупки",
  "hardware.installStatus": "Статус установки",
  "hardware.validation.nameRequired": "Обязательное поле",
  "hardware.validation.purchaseStatusRequired": "Обязательное поле",
  "hardware.validation.installStatusRequired": "Обязательное поле",
  "hardware.addTitle": "Добавить оборудование",
  "hardware.editTitle": "Редактировать оборудование",
  "common.add": "Добавить",
  "common.save": "Сохранить",
  "common.cancel": "Отмена",
  "common.edit": "Редактировать",
  "inventory.noDescription": "Описание отсутствует",
};

vi.mock("@/i18n", () => ({
  t: (key) => translations[key] ?? key,
}));

vi.mock("@/utils/linkify", () => ({
  linkifyText: (value) => value,
}));

vi.mock("@/components/HardwareCard", () => ({
  __esModule: true,
  default: ({ item }) => <div>{item.name}</div>,
}));

vi.mock("@/components/Spinner", () => ({
  __esModule: true,
  default: () => <div>spinner</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children }) => <div>{children}</div>,
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogFooter: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props) => <input {...props} />,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }) => <div>{children}</div>,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ children, ...props }) => (
    <div role="option" {...props}>
      {children}
    </div>
  ),
  SelectTrigger: ({ children, ...props }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  SelectValue: ({ children }) => <span>{children}</span>,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }) => <div>{children}</div>,
  TabsList: ({ children }) => <div>{children}</div>,
  TabsTrigger: ({ children, ...props }) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  TabsContent: ({ children }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/textarea", () => ({
  Textarea: ({ children, ...props }) => <textarea {...props}>{children}</textarea>,
}));

vi.mock("@/components/FormError.jsx", () => ({
  __esModule: true,
  default: () => null,
}));

vi.mock("@/components/TasksTab.jsx", () => ({
  __esModule: true,
  default: function TasksTab({ onCountChange }) {
    React.useEffect(() => {
      onCountChange(5);
    }, [onCountChange]);
    return <div>tasks-tab</div>;
  },
}));

vi.mock("@/components/ChatTab.jsx", () => ({
  __esModule: true,
  default: function ChatTab({ onCountChange }) {
    React.useEffect(() => {
      onCountChange(3);
    }, [onCountChange]);
    return <div>chat-tab</div>;
  },
}));

import InventoryTabs from "@/components/InventoryTabs";

describe("InventoryTabs", () => {
  test("отображает количество элементов на вкладках", async () => {
    render(
      <InventoryTabs
        selected={{ id: 1, description: "" }}
        onUpdateSelected={() => {}}
        registerAddHandler={() => {}}
      />,
    );

    expect(screen.getByText("Железо (2)")).toBeInTheDocument();
    expect(await screen.findByText("Задачи (5)")).toBeInTheDocument();
    expect(await screen.findByText("Чат (3)")).toBeInTheDocument();
    expect(screen.getByText("Описание")).toBeInTheDocument();
  });
});

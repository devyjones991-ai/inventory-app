
import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import InventoryTabs from '../src/components/InventoryTabs'

describe('InventoryTabs localStorage recovery', () => {
  const objectId = 1
  const selected = { id: objectId, name: 'Test', description: '' }
  const user = { user_metadata: { username: 'tester' }, email: 'test@example.com' }
  const hwFormKey = `hwForm_${objectId}`
  const hwModalKey = `hwModal_${objectId}`
  const taskFormKey = `taskForm_${objectId}`
  const taskModalKey = `taskModal_${objectId}`
  const tabKey = `tab_${objectId}`

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InventoryTabs from "@/components/InventoryTabs";

vi.mock("@/supabaseClient.js", () => {
  const createQuery = () => {

    const query = {}
    query.select = vi.fn(() => query)
    query.eq = vi.fn(() => query)
    query.order = vi.fn(() => query)
    query.range = vi.fn(() => query)
    query.then = vi.fn((resolve) => Promise.resolve({ data: [] }).then(resolve))
    return query
  }

    const query = {};
    query.select = vi.fn(() => query);
    query.eq = vi.fn(() => query);
    query.order = vi.fn(() => Promise.resolve({ data: [] }));
    query.then = vi.fn((resolve) =>
      Promise.resolve({ data: [] }).then(resolve),
    );
    return query;
  };

  return {
    supabase: {
      from: vi.fn(() => createQuery()),
      channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(() => ({})),
      })),
      removeChannel: vi.fn(),
    },
  };
});

describe("InventoryTabs localStorage recovery", () => {
  const objectId = 1;
  const selected = { id: objectId, name: "Test", description: "" };
  const user = {
    user_metadata: { username: "tester" },
    email: "test@example.com",
  };
  const hwFormKey = `hwForm_${objectId}`;
  const hwModalKey = `hwModal_${objectId}`;
  const taskFormKey = `taskForm_${objectId}`;
  const taskModalKey = `taskModal_${objectId}`;
  const tabKey = `tab_${objectId}`;


  beforeEach(() => {
    localStorage.clear();
  });

  const defaultHWForm = {
    name: "",
    location: "",
    purchase_status: "не оплачен",
    install_status: "не установлен",
  };
  const defaultTaskForm = {
    title: "",
    status: "запланировано",
    assignee: "",
    due_date: "",
    notes: "",
  };

  it("resets forms and clears storage on malformed JSON", async () => {
    localStorage.setItem(hwFormKey, "{bad json");
    localStorage.setItem(hwModalKey, "true");
    localStorage.setItem(taskFormKey, "{bad json");
    localStorage.setItem(taskModalKey, "true");
    localStorage.setItem(tabKey, "hw");

    render(
      <InventoryTabs
        selected={selected}
        onUpdateSelected={() => {}}
        user={user}
        onTabChange={() => {}}
      />,
    );

    await waitFor(() => {
      expect(localStorage.getItem(hwFormKey)).toBe(
        JSON.stringify(defaultHWForm),
      );
    });
    const hwNameInput = await screen.findByPlaceholderText(
      "Например, keenetic giga",
    );
    expect(hwNameInput).toHaveValue("");
    expect(screen.getByText("Не оплачен").selected).toBe(true);
    expect(screen.getByText("Не установлен").selected).toBe(true);

    fireEvent.click(screen.getByText(/Задачи/));

    await waitFor(() => {
      expect(localStorage.getItem(taskFormKey)).toBe(
        JSON.stringify(defaultTaskForm),
      );
    });
    expect(screen.getByText("Запланировано").selected).toBe(true);
  });
});

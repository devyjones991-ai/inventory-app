
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import InventoryTabs from '../src/components/InventoryTabs';
import { supabase } from '../src/supabaseClient.js';
import { toast } from 'react-hot-toast';

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const { insertMock, supabaseMock } = vi.hoisted(() => {
  const insertMock = vi.fn((records) => ({
    select: vi.fn(() => ({
      single: vi.fn(() =>
        Promise.resolve({ data: { id: 1, ...records[0] }, error: null }),
      ),
    })),
  }));
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),

    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then: vi.fn(cb => cb({ data: [] })),

    order: vi.fn(() => Promise.resolve({ data: [] })),
    then: vi.fn((cb) => cb({ data: [] })),

    insert: insertMock,
  };
  const supabaseMock = {
    from: vi.fn(() => ({ ...chain })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  };
  return { insertMock, supabaseMock };
});

vi.mock("@/supabaseClient.js", () => ({
  supabase: supabaseMock,
}));


vi.mock('react-hot-toast', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
vi.mock("react-hot-toast", () => ({
  toast: { error: toastErrorMock, success: vi.fn() },
}));

import InventoryTabs from "@/components/InventoryTabs";


const user = {
  user_metadata: { username: "tester" },
  email: "test@example.com",
};

describe("task form validation", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });


  it('shows error and blocks empty task', async () => {
    const insertMock = vi.fn();
    const selectMock = vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ then: vi.fn(cb => { cb({ data: [] }); }) })) })) }));
    vi.spyOn(supabase, 'from').mockReturnValue({ select: selectMock, insert: insertMock, eq: vi.fn(), order: vi.fn() });
    const toastErrorMock = vi.spyOn(toast, 'error').mockImplementation(() => {});

    render(<InventoryTabs selected={{ id: 1, name: 'Obj', description: '' }} onUpdateSelected={() => {}} user={user} />);
    fireEvent.click(screen.getByText('Задачи (0)'));
    fireEvent.click(screen.getByRole('button', { name: /Добавить задачу/ }));
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => {
      expect(screen.getByText('Введите название')).toBeInTheDocument();
    });
  it("shows error and blocks empty task", async () => {
    render(
      <InventoryTabs
        selected={{ id: 1, name: "Obj", description: "" }}
        onUpdateSelected={() => {}}
        user={user}
      />,
    );
    fireEvent.click(screen.getByText("Задачи (0)"));
    fireEvent.click(screen.getByRole("button", { name: /Добавить задачу/ }));
    fireEvent.click(screen.getByText("Сохранить"));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
    expect(insertMock).not.toHaveBeenCalled();
  });


  it('saves filled task', async () => {
    const insertMock = vi.fn(records => ({
      select: () => ({ single: () => Promise.resolve({ data: { id: 1, ...records[0] }, error: null }) })
    }));
    const selectMock = vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(() => ({ then: vi.fn(cb => { cb({ data: [] }); }) })) })) }));
    vi.spyOn(supabase, 'from').mockReturnValue({ select: selectMock, insert: insertMock, eq: vi.fn(), order: vi.fn() });
    vi.spyOn(toast, 'error').mockImplementation(() => {});
    vi.spyOn(toast, 'success').mockImplementation(() => {});

    render(<InventoryTabs selected={{ id: 1, name: 'Obj', description: '' }} onUpdateSelected={() => {}} user={user} />);
    fireEvent.click(screen.getByText('Задачи (0)'));
    fireEvent.click(screen.getByRole('button', { name: /Добавить задачу/ }));
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Task title' } });
    fireEvent.change(inputs[1], { target: { value: 'Bob' } });
    fireEvent.click(screen.getByText('Сохранить'));

  it("saves filled task", async () => {
    render(
      <InventoryTabs
        selected={{ id: 1, name: "Obj", description: "" }}
        onUpdateSelected={() => {}}
        user={user}
      />,
    );
    fireEvent.click(screen.getByText("Задачи (0)"));
    fireEvent.click(screen.getByRole("button", { name: /Добавить задачу/ }));
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Task title" } });
    fireEvent.change(inputs[1], { target: { value: "Bob" } });
    fireEvent.click(screen.getByText("Сохранить"));

    await waitFor(() => expect(insertMock).toHaveBeenCalled());
    expect(insertMock.mock.calls[0][0][0]).toEqual({
      object_id: 1,
      title: "Task title",
      status: "запланировано",
      assignee: "Bob",
      planned_date: null,
      plan_date: null,
      notes: null,
    });
  });
});

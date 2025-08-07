import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { insertMock, supabaseMock, toastErrorMock } = vi.hoisted(() => {
  const insertMock = vi.fn((records) => ({
    select: vi.fn(() => ({
      single: vi.fn(() => Promise.resolve({ data: { id: 1, ...records[0] }, error: null }))
    }))
  }));
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    then: vi.fn(cb => cb({ data: [] })),
    insert: insertMock,
  };
  const supabaseMock = {
    from: vi.fn(() => ({ ...chain })),
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  };
  const toastErrorMock = vi.fn();
  return { insertMock, supabaseMock, toastErrorMock };
});

vi.mock('../src/supabaseClient.js', () => ({
  supabase: supabaseMock,
}));

vi.mock('react-hot-toast', () => ({
  toast: { error: toastErrorMock, success: vi.fn() },
}));

import InventoryTabs from '../src/components/InventoryTabs';

const user = { user_metadata: { username: 'tester' }, email: 'test@example.com' };

describe('task form validation', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows error and blocks empty task', async () => {
    render(<InventoryTabs selected={{ id: 1, name: 'Obj', description: '' }} onUpdateSelected={() => {}} user={user} />);
    fireEvent.click(screen.getByText('Задачи (0)'));
    fireEvent.click(screen.getByRole('button', { name: /Добавить задачу/ }));
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => expect(toastErrorMock).toHaveBeenCalled());
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('saves filled task', async () => {
    render(<InventoryTabs selected={{ id: 1, name: 'Obj', description: '' }} onUpdateSelected={() => {}} user={user} />);
    fireEvent.click(screen.getByText('Задачи (0)'));
    fireEvent.click(screen.getByRole('button', { name: /Добавить задачу/ }));
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Task title' } });
    fireEvent.change(inputs[1], { target: { value: 'Bob' } });
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => expect(insertMock).toHaveBeenCalled());
    expect(insertMock.mock.calls[0][0][0]).toEqual({
      object_id: 1,
      title: 'Task title',
      status: 'запланировано',
      assignee: 'Bob',
      planned_date: null,
      plan_date: null,
      notes: null,
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const insertSpy = vi.fn(() => ({
  select: vi.fn(() => ({
    single: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null }))
  }))
}));

vi.mock('../src/supabaseClient', () => {
  const createQuery = () => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn(() => Promise.resolve({ data: [] })),
    then: vi.fn(cb => cb({ data: [] })),
    insert: insertSpy,
    update: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => Promise.resolve({ data: { id: 1 }, error: null })) })) }))
  });
  return {
    supabase: {
      from: vi.fn(() => createQuery()),
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
      removeChannel: vi.fn(),
    }
  };
});

import InventoryTabs from '../src/components/InventoryTabs';

const user = { user_metadata: { username: 'tester' }, email: 'test@example.com' };

describe('saveTask uses executor column', () => {
  beforeEach(() => {
    localStorage.clear();
    insertSpy.mockClear();
  });

  it('sends executor and omits assignee and due_date', async () => {
    render(<InventoryTabs selected={{ id: 1, name: 'Obj', description: '' }} onUpdateSelected={() => {}} user={user} />);
    fireEvent.click(screen.getByText('Задачи (0)'));
    fireEvent.click(screen.getByRole('button', { name: /Добавить задачу/ }));
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'Test task' } });
    fireEvent.change(inputs[1], { target: { value: 'Bob' } });
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => expect(insertSpy).toHaveBeenCalled());
    const payload = insertSpy.mock.calls[0][0][0];
    expect(payload.executor).toBe('Bob');
    expect(payload.assignee).toBeUndefined();
    expect(payload.due_date).toBeUndefined();
  });
});

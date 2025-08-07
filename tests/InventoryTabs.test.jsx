import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/supabaseClient.js', () => {
  const order = vi.fn(() => Promise.resolve({ data: [], error: null }));
  const chain = { select: vi.fn(() => chain), eq: vi.fn(() => chain), order };
  return {
    supabase: {
      from: vi.fn(() => chain),
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
      removeChannel: vi.fn(),
    }
  };
});
vi.mock('../src/utils/notifications', () => ({ pushNotification: vi.fn(), playTaskSound: vi.fn(), playMessageSound: vi.fn() }));
vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn() } }));
vi.mock('../src/components/ChatTab', () => ({ default: () => <div data-testid="chat-tab">ChatMock</div> }));

import InventoryTabs from '../src/components/InventoryTabs';

const user = { user_metadata: { username: 'User' }, email: 'user@example.com' };

const renderComponent = (selected) => render(
  <InventoryTabs selected={selected} onUpdateSelected={() => {}} user={user} onTabChange={() => {}} />
);

describe('InventoryTabs', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  it('shows description tab and handles empty description', () => {
    renderComponent({ id: 1, name: 'Obj', description: '' });
    expect(screen.getByText('Нет описания')).toBeInTheDocument();
    expect(screen.getByText('Описание')).toBeInTheDocument();
  });

  it('switches tabs and renders chat', () => {
    renderComponent({ id: 1, name: 'Obj', description: '' });
    fireEvent.click(screen.getByText('Железо (0)'));
    expect(screen.getByText('Оборудование')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Задачи (0)'));
    expect(screen.getByText('Задачи')).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Чат \(0\)/));
    expect(screen.getByTestId('chat-tab')).toBeInTheDocument();
  });

  it('toggles description edit mode', () => {
    renderComponent({ id: 1, name: 'Obj', description: 'Initial' });
    fireEvent.click(screen.getByText('Редактировать'));
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Changed' } });
    fireEvent.click(screen.getByText('Отмена'));
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.getByText('Changed')).toBeInTheDocument();
  });
});

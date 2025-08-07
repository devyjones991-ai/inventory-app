import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

let hardwareDataMock = [];
let tasksDataMock = [];
let chatDataMock = [];

vi.mock('../src/supabaseClient.js', () => {
  const from = vi.fn((table) => {
    const dataMap = {
      hardware: hardwareDataMock,
      tasks: tasksDataMock,
      chat_messages: chatDataMock,
    };
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn(cb => cb({ data: dataMap[table] || [] }))
    };
    return chain;
  });
  return {
    supabase: {
      from,
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
      removeChannel: vi.fn(),
    }
  };
});
vi.mock('../src/utils/notifications', () => ({ pushNotification: vi.fn(), playTaskSound: vi.fn(), playMessageSound: vi.fn() }));
vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../src/components/ChatTab', () => ({ default: () => <div data-testid="chat-tab">ChatMock</div> }));

import InventoryTabs from '../src/components/InventoryTabs';

const user = { user_metadata: { username: 'User' }, email: 'user@example.com' };

const renderComponent = (selected) => render(
  <InventoryTabs selected={selected} onUpdateSelected={() => {}} user={user} onTabChange={() => {}} />
);

describe('InventoryTabs', () => {
  beforeEach(() => {
    localStorage.clear();
    hardwareDataMock = [];
    tasksDataMock = [];
    chatDataMock = [];
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

  it('shows load more button when hardware has more', async () => {
    hardwareDataMock = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }));
    renderComponent({ id: 1, name: 'Obj', description: '' });
    await screen.findByText('Железо (20)');
    fireEvent.click(screen.getByText('Железо (20)'));
    expect(await screen.findByText('Загрузить ещё')).toBeInTheDocument();
  });
});

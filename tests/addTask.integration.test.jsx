import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach, vi } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import InventoryTabs from '../src/components/InventoryTabs';

vi.mock('react-hot-toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('../src/supabaseClient.js', () => {
  const baseUrl = 'https://example.supabase.co';
  return {
    supabase: {
      from: (table) => {
        if (table === 'tasks') {
          return {
            select: () => ({
              eq: (_field, id) => ({
                order: () =>
                  fetch(`${baseUrl}/rest/v1/tasks?object_id=eq.${id}`).then(r => r.json()).then(data => ({ data, error: null }))
              })
            }),
            insert: (records) => ({
              select: () => ({
                single: () =>
                  fetch(`${baseUrl}/rest/v1/tasks`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(records)
                  }).then(r => r.json()).then(data => ({ data: data[0], error: null }))
              })
            })
          };
        }
        if (table === 'chat_messages') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [] })
            })
          };
        }
        return {
          select: () => ({
            eq: () => ({
              order: () => Promise.resolve({ data: [] })
            })
          })
        };
      },
      channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
      removeChannel: vi.fn()
    }
  };
});

const server = setupServer(
  http.get('*/rest/v1/tasks', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('object_id')) {
      return HttpResponse.json([]);
    }
    return HttpResponse.json(null, { status: 500 });
  }),
  http.post('*/rest/v1/tasks', async ({ request }) => {
    const body = await request.json();
    const record = Array.isArray(body) ? body[0] : body;
    return HttpResponse.json([{ id: 1, ...record }], { status: 201 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const user = { user_metadata: { username: 'User' }, email: 'user@example.com' };

describe('add task integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('создает задачу и закрывает модальное окно', async () => {
    render(<InventoryTabs selected={{ id: 1, name: 'Obj', description: '' }} onUpdateSelected={() => {}} user={user} />);
    fireEvent.click(screen.getByText('Задачи (0)'));
    fireEvent.click(screen.getByRole('button', { name: /Добавить задачу/ }));
    const [titleInput, assigneeInput] = screen.getAllByRole('textbox');
    fireEvent.change(titleInput, { target: { value: 'Новая задача' } });
    fireEvent.change(assigneeInput, { target: { value: 'Исполнитель' } });
    fireEvent.click(screen.getByText('Сохранить'));
    await waitFor(() => expect(screen.getByText('Новая задача')).toBeInTheDocument());
    expect(screen.queryByText('Сохранить')).not.toBeInTheDocument();
  });
});

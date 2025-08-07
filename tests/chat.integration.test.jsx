import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

vi.hoisted(() => {
  vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost');
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon');
});

import ChatTab from '../src/components/ChatTab.jsx';

const server = setupServer(
  http.get('*/rest/v1/chat_messages', () => HttpResponse.json([])),
  http.post('*/rest/v1/chat_messages', async ({ request }) => {
    const body = await request.json();
    const msg = body[0];
    return HttpResponse.json([
      { id: '1', created_at: '2024-01-01T00:00:00Z', ...msg }
    ], { status: 201 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const user = { user_metadata: { username: 'Tester' }, email: 'test@example.com' };
const selected = { id: 'object1' };

describe('ChatTab integration', () => {
  it('показывает отправленное сообщение и очищает поле ввода', async () => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();

    render(<ChatTab selected={selected} user={user} />);

    const textarea = screen.getByPlaceholderText('Введите сообщение...');
    fireEvent.change(textarea, { target: { value: 'Привет' } });

    const sendButton = screen.getByRole('button');
    await fireEvent.click(sendButton);

    await screen.findByText('Привет');
    await waitFor(() => expect(textarea.value).toBe(''));
  });
});

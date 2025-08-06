import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

import ChatTab from '../src/components/ChatTab';

const { uploadMock, getPublicUrlMock, insertMock, supabaseMock } = vi.hoisted(() => {
  const uploadMock = vi.fn();
  const getPublicUrlMock = vi.fn();
  const insertMock = vi.fn();
  const selectMock = vi.fn(() => ({
    eq: vi.fn(() => ({
      order: vi.fn(() => ({ then: cb => { cb({ data: [] }); } }))
    }))
  }));
  const fromMock = vi.fn(table => {
    if (table === 'chat_messages') {
      return { select: selectMock, insert: insertMock };
    }
    return {};
  });
  const supabaseMock = {
    from: fromMock,
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
    storage: { from: vi.fn(() => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock })) }
  };
  return { uploadMock, getPublicUrlMock, insertMock, supabaseMock };
});

vi.mock('../src/supabaseClient', () => ({ supabase: supabaseMock }));

const selected = { id: 1 };
const user = { user_metadata: { username: 'User' }, email: 'user@example.com' };

describe('ChatTab', () => {
  beforeAll(() => {
    // jsdom doesn't implement scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    insertMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 1, sender: 'User', content: 'hi', file_url: null, created_at: '2024-01-01' } })
      })
    });
  });

  it('renders empty state when no messages', () => {
    render(<ChatTab selected={selected} user={user} />);
    expect(screen.getByText('Нет сообщений. Начните диалог.')).toBeInTheDocument();
  });

  it('sends a message and clears input', async () => {
    render(<ChatTab selected={selected} user={user} />);
    const textarea = screen.getByPlaceholderText('Введите сообщение...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    const sendBtn = screen.getByRole('button');
    fireEvent.click(sendBtn);

    await waitFor(() => expect(insertMock).toHaveBeenCalled());
    expect(textarea.value).toBe('');
  });

  it('does not send empty messages', () => {
    render(<ChatTab selected={selected} user={user} />);
    const sendBtn = screen.getByRole('button');
    fireEvent.click(sendBtn);
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('shows image attachment after upload', async () => {
    uploadMock.mockResolvedValue({ data: {}, error: null });
    const url = 'https://example.com/test.png';
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: url } });
    insertMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 1, sender: 'User', content: '', file_url: url, created_at: '2024-01-01' } })
      })
    });

    const { container } = render(<ChatTab selected={selected} user={user} />);
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['img'], 'test.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const sendBtn = screen.getByRole('button');
    fireEvent.click(sendBtn);

    await waitFor(() => expect(uploadMock).toHaveBeenCalled());
    const link = await screen.findByText('📎 Прикреплённый файл');
    expect(link.closest('a')).toHaveAttribute('href', url);
  });

  it('shows video attachment after upload', async () => {
    uploadMock.mockResolvedValue({ data: {}, error: null });
    const url = 'https://example.com/test.mp4';
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: url } });
    insertMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 1, sender: 'User', content: '', file_url: url, created_at: '2024-01-01' } })
      })
    });

    const { container } = render(<ChatTab selected={selected} user={user} />);
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['vid'], 'test.mp4', { type: 'video/mp4' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const sendBtn = screen.getByRole('button');
    fireEvent.click(sendBtn);

    await waitFor(() => expect(uploadMock).toHaveBeenCalled());
    const link = await screen.findByText('📎 Прикреплённый файл');
    expect(link.closest('a')).toHaveAttribute('href', url);
  });

  it('shows document attachment after upload', async () => {
    uploadMock.mockResolvedValue({ data: {}, error: null });
    const url = 'https://example.com/test.pdf';
    getPublicUrlMock.mockReturnValue({ data: { publicUrl: url } });
    insertMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: 1, sender: 'User', content: '', file_url: url, created_at: '2024-01-01' } })
      })
    });

    const { container } = render(<ChatTab selected={selected} user={user} />);
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['doc'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const sendBtn = screen.getByRole('button');
    fireEvent.click(sendBtn);

    await waitFor(() => expect(uploadMock).toHaveBeenCalled());
    const link = await screen.findByText('📎 Прикреплённый файл');
    expect(link.closest('a')).toHaveAttribute('href', url);
  });
});

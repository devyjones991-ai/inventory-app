import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

const insertMock = vi.fn();
codex/add-video-file-handling-in-attachmentpreview
let mockMessages = [];

codex/add-attachment-preview-component-to-chattab
const mockMessages = [];
let realtimeHandler;
main
main

vi.mock('../src/supabaseClient', () => {
  const from = vi.fn((table) => {
    if (table === 'chat_messages') {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
codex/add-video-file-handling-in-attachmentpreview
            order: vi.fn().mockReturnValue({ then: (cb) => cb({ data: mockMessages }) })

            order: vi.fn().mockReturnValue({
              then: (cb) => cb({ data: mockMessages })
            })
main
          })
        }),
        insert: insertMock.mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { id: 1, sender: 'User', content: 'hi', created_at: '2024-01-01' } })
          })
        })
      };
    }
    return {};
  });
  const channel = {
    on: vi.fn((event, filter, handler) => {
      realtimeHandler = handler;
      return channel;
    }),
    subscribe: vi.fn()
  };

  return {
    supabase: {
      from,
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
      storage: { from: vi.fn(() => ({ upload: vi.fn(), getPublicUrl: vi.fn() })) }
    }
  };
});

import ChatTab from '../src/components/ChatTab';

const selected = { id: 1 };
const user = { user_metadata: { username: 'User' }, email: 'user@example.com' };

describe('ChatTab', () => {
  beforeAll(() => {
    // jsdom doesn't implement scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  beforeEach(() => {
    insertMock.mockClear();
codex/add-video-file-handling-in-attachmentpreview
    mockMessages = [];

    mockMessages.length = 0;
main
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

codex/add-video-file-handling-in-attachmentpreview
  it('renders video attachment and toggles fullscreen', async () => {
    mockMessages = [
      {
        id: 1,
        sender: 'User',
        content: '',
        file_url: 'http://example.com/video.mp4',
        created_at: '2024-01-01'
      }
    ];
    render(<ChatTab selected={selected} user={user} />);

    const video = await screen.findByTestId('attachment-video');
    expect(video).toBeInTheDocument();

    fireEvent.click(video);
    const modal = await screen.findByTestId('video-modal');
    expect(modal).toBeInTheDocument();

    fireEvent.click(screen.getByText('Закрыть'));
    await waitFor(() =>
      expect(screen.queryByTestId('video-modal')).not.toBeInTheDocument()
    );

codex/add-attachment-preview-component-to-chattab
  it('renders image attachment and opens modal on click', async () => {
    mockMessages.push({
      id: 2,
      sender: 'Other',
      content: '',
      file_url: 'http://example.com/test.png',
      created_at: '2024-01-01'
    });

    render(<ChatTab selected={selected} user={user} />);

    const img = await screen.findByAltText('attachment');
    expect(img).toBeInTheDocument();

    fireEvent.click(img);
    expect(screen.getByAltText('preview')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Close'));
    expect(screen.queryByAltText('preview')).not.toBeInTheDocument();
  
it('adds a message on external INSERT event', async () => {
    render(<ChatTab selected={selected} user={user} />);

    await waitFor(() => expect(realtimeHandler).toBeDefined());

    act(() => {
      realtimeHandler({
        new: {
          id: 2,
          sender: 'User',
          content: 'External message',
          created_at: '2024-01-02'
        }
      });
    });

    expect(screen.getByText('External message')).toBeInTheDocument();
main
main
  });
});

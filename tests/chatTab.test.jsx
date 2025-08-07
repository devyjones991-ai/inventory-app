import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatTab from '../src/components/ChatTab.jsx';
import { toast } from 'react-hot-toast';
import { supabase } from '../src/supabaseClient';

const user = { user_metadata: { username: 'Tester' }, email: 'test@example.com' };
const selected = { id: 'object1' };

describe('ChatTab file upload', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('sends message when upload succeeds', async () => {
    const uploadMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: 'public-url' } }));
    vi.spyOn(supabase.storage, 'from').mockReturnValue({ upload: uploadMock, getPublicUrl: getPublicUrlMock });
    const insertMock = vi.fn(() => ({ select: () => ({ single: () => Promise.resolve({ data: { id: '1' }, error: null }) }) }));
    const selectMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn(cb => {
            cb({ data: [], error: null });
            return Promise.resolve({ data: [], error: null });
          })
        }))
      }))
    }));
    vi.spyOn(supabase, 'from').mockReturnValue({ select: selectMock, insert: insertMock });
    vi.spyOn(toast, 'error').mockImplementation(() => {});

    const { container, getByPlaceholderText } = render(<ChatTab selected={selected} user={user} />);
    const textarea = getByPlaceholderText('Введите сообщение...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    const sendButton = container.querySelector('button');
    await fireEvent.click(sendButton);
    await waitFor(() => expect(uploadMock).toHaveBeenCalled());
    expect(insertMock).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(fileInput.value).toBe('');
  });

  it('shows error and blocks message on upload failure', async () => {
    const uploadMock = vi.fn().mockResolvedValue({ data: null, error: new Error('fail') });
    const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: 'public-url' } }));
    vi.spyOn(supabase.storage, 'from').mockReturnValue({ upload: uploadMock, getPublicUrl: getPublicUrlMock });
    const insertMock = vi.fn(() => ({ select: () => ({ single: () => Promise.resolve({ data: { id: '1' }, error: null }) }) }));
    const selectMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn(cb => {
            cb({ data: [], error: null });
            return Promise.resolve({ data: [], error: null });
          })
        }))
      }))
    }));
    vi.spyOn(supabase, 'from').mockReturnValue({ select: selectMock, insert: insertMock });
    const toastErrorMock = vi.spyOn(toast, 'error').mockImplementation(() => {});

    const { container, getByPlaceholderText } = render(<ChatTab selected={selected} user={user} />);
    const textarea = getByPlaceholderText('Введите сообщение...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });
    const sendButton = container.querySelector('button');
    await fireEvent.click(sendButton);
    await waitFor(() => expect(uploadMock).toHaveBeenCalled());
    expect(toastErrorMock).toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
    expect(fileInput.value).toBe('');
  });
});

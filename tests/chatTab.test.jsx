import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatTab from '../src/components/ChatTab.jsx';
import { toast } from 'react-hot-toast';

const { uploadMock, insertMock, supabaseMock, toastErrorMock } = vi.hoisted(() => {
  const uploadMock = vi.fn();
  const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: 'public-url' } }));
  const singleMock = vi.fn().mockResolvedValue({ data: { id: '1' }, error: null });
  const selectAfterInsertMock = vi.fn(() => ({ single: singleMock }));
  const insertMock = vi.fn(() => ({ select: selectAfterInsertMock }));
  const rangeMock = vi.fn(() => Promise.resolve({ data: [], error: null }));
  const orderMock = vi.fn(() => ({ range: rangeMock }));
  const eqMock = vi.fn(() => ({ order: orderMock }));
  const selectMock = vi.fn(() => ({ eq: eqMock }));
  const fromMock = vi.fn(() => ({ select: selectMock, insert: insertMock }));
  const channelMock = vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }));
  const removeChannelMock = vi.fn();
  const supabaseMock = {
    from: fromMock,
    storage: { from: vi.fn(() => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock })) },
    channel: channelMock,
    removeChannel: removeChannelMock,
  };
  const toastErrorMock = vi.fn();
  return { uploadMock, insertMock, supabaseMock, toastErrorMock };
});

vi.mock('../src/supabaseClient.js', () => ({
  supabase: supabaseMock,
}));

vi.mock('react-hot-toast', () => ({
  toast: { error: toastErrorMock },
}));

const user = { user_metadata: { username: 'Tester' }, email: 'test@example.com' };
const selected = { id: 'object1' };

describe('ChatTab file upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // jsdom doesn't implement scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('sends message when upload succeeds', async () => {
    uploadMock.mockResolvedValue({ data: {}, error: null });

    const { container, getByPlaceholderText, getByLabelText } = render(<ChatTab selected={selected} user={user} />);
    const textarea = getByPlaceholderText('Введите сообщение...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const sendButton = getByLabelText('Send');
    await fireEvent.click(sendButton);

    await waitFor(() => expect(uploadMock).toHaveBeenCalled());
    expect(insertMock).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
    expect(fileInput.value).toBe('');
  });

  it('shows error and blocks message on upload failure', async () => {
    uploadMock.mockResolvedValue({ data: null, error: new Error('fail') });

    const { container, getByPlaceholderText, getByLabelText } = render(<ChatTab selected={selected} user={user} />);
    const textarea = getByPlaceholderText('Введите сообщение...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });
    const fileInput = container.querySelector('input[type="file"]');
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const sendButton = getByLabelText('Send');
    await fireEvent.click(sendButton);

    await waitFor(() => expect(uploadMock).toHaveBeenCalled());
    expect(toastErrorMock).toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
    expect(fileInput.value).toBe('');
  });
});

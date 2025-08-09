
// codex/ensure-single-test-filename-format


import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChatTab from '../src/components/ChatTab.jsx'


const { supabaseMock, insertMock, initialMessages } = vi.hoisted(() => {
  const initialMessages = [
    {
      id: '1',
      object_id: '1',
      sender: 'Alice',
      content: 'Привет',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      object_id: '1',
      sender: 'Bob',
      content: 'Здравствуйте',
      created_at: new Date().toISOString(),
    },
  ]

  const selectMock = vi.fn(() => ({
    eq: vi.fn(() => ({
      order: vi.fn(() =>
        Promise.resolve({ data: initialMessages, error: null }),
      ),
    })),
  }))

  const insertMock = vi.fn(() =>
    Promise.resolve({ data: { id: '3' }, error: null }),
  )

  const fromMock = vi.fn(() => ({ select: selectMock, insert: insertMock }))

  const channelMock = vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  }))
import { toast } from 'react-hot-toast'

const { uploadMock, insertMock, supabaseMock, toastErrorMock } = vi.hoisted(
  () => {
    const uploadMock = vi.fn()
    const getPublicUrlMock = vi.fn(() => ({
      data: { publicUrl: 'public-url' },
    }))
    const singleMock = vi
      .fn()
      .mockResolvedValue({ data: { id: '1' }, error: null })
    const selectAfterInsertMock = vi.fn(() => ({ single: singleMock }))
    const insertMock = vi.fn(() => ({ select: selectAfterInsertMock }))
    const selectMock = vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({
          then: vi.fn((cb) => {
            cb({ data: [], error: null })
            return Promise.resolve({ data: [], error: null })
          }),
        })),
      })),
    }))
    const fromMock = vi.fn(() => ({ select: selectMock, insert: insertMock }))
    const channelMock = vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }))
    const removeChannelMock = vi.fn()
    const supabaseMock = {
      from: fromMock,
      storage: {
        from: vi.fn(() => ({
          upload: uploadMock,
          getPublicUrl: getPublicUrlMock,
        })),
      },
      channel: channelMock,
      removeChannel: removeChannelMock,
    }
    const toastErrorMock = vi.fn()
    return { uploadMock, insertMock, supabaseMock, toastErrorMock }
  },
)

vi.mock('../src/supabaseClient.js', () => ({
  supabase: supabaseMock,
}))

vi.mock('react-hot-toast', () => ({
  toast: { error: toastErrorMock },
}))

const user = {
  user_metadata: { username: 'Tester' },
  email: 'test@example.com',
}
const selected = { id: 'object1' }

describe('ChatTab file upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom doesn't implement scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('sends message when upload succeeds', async () => {
    uploadMock.mockResolvedValue({ data: {}, error: null })

    const { container, getByPlaceholderText } = render(
      <ChatTab selected={selected} user={user} />,
    )
    const textarea = getByPlaceholderText('Введите сообщение...')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    const fileInput = container.querySelector('input[type="file"]')
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    const sendButton = container.querySelector('button')
    await fireEvent.click(sendButton)

    await waitFor(() => expect(uploadMock).toHaveBeenCalled())
    expect(insertMock).toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows error and blocks message on upload failure', async () => {
    uploadMock.mockResolvedValue({ data: null, error: new Error('fail') })

    const { container, getByPlaceholderText } = render(
      <ChatTab selected={selected} user={user} />,
    )
    const textarea = getByPlaceholderText('Введите сообщение...')
    fireEvent.change(textarea, { target: { value: 'Hello' } })
    const fileInput = container.querySelector('input[type="file"]')
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    const sendButton = container.querySelector('button')
    await fireEvent.click(sendButton)

    await waitFor(() => expect(uploadMock).toHaveBeenCalled())
    expect(toastErrorMock).toHaveBeenCalled()
    expect(insertMock).not.toHaveBeenCalled()
  })
})


  const removeChannelMock = vi.fn()

  const supabaseMock = {
    from: fromMock,
    channel: channelMock,
    removeChannel: removeChannelMock,
  }

  return { supabaseMock, insertMock, initialMessages }
})


vi.mock('../src/supabaseClient.js', () => ({ supabase: supabaseMock }))

describe('ChatTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom doesn't implement scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('отображает сообщения и отправляет новое', async () => {
    render(<ChatTab selected={{ id: '1' }} user={{ email: 'me' }} />)

    for (const msg of initialMessages) {
      expect(await screen.findByText(msg.content)).toBeInTheDocument()
    }

    const textarea = screen.getByPlaceholderText(
      'Напиши сообщение… (Enter — отправить, Shift+Enter — новая строка)',
    )
    fireEvent.change(textarea, { target: { value: 'Новое сообщение' } })

    fireEvent.click(screen.getByText('Отправить'))

    await waitFor(() => expect(insertMock).toHaveBeenCalled())
    expect(textarea.value).toBe('')
  })
})

import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChatTab from '../src/components/ChatTab.jsx'
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

const initialMessages = [
  { id: '1', sender: 'Alice', content: 'Привет' },
  { id: '2', sender: 'Bob', content: 'Здравствуйте' },
]

const fetchMessagesMock = vi.fn(() =>
  Promise.resolve({ data: initialMessages, error: null }),
)
let subscribeHandler
const subscribeToMessagesMock = vi.fn((_objectId, handler) => {
  subscribeHandler = handler
  return () => {}
})
const sendMessageMock = vi.fn(async ({ objectId, sender, content }) => {
  const newMessage = {
    id: String(Date.now()),
    object_id: objectId,
    sender,
    content,
  }
  if (subscribeHandler) {
    subscribeHandler({ new: newMessage })
  }
  return { data: newMessage, error: null }
})

vi.mock('@/hooks/useChatMessages.js', () => ({
  useChatMessages: () => ({
    fetchMessages: fetchMessagesMock,
    sendMessage: sendMessageMock,
    subscribeToMessages: subscribeToMessagesMock,
  }),
}))

describe('ChatTab', () => {
  it('отображает сообщения и форму отправки', async () => {
    render(<ChatTab selected={{ id: '1' }} user={{ email: 'me' }} />)
    for (const msg of initialMessages) {
      expect(await screen.findByText(msg.content)).toBeInTheDocument()
    }
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('отправляет новое сообщение', async () => {
    render(<ChatTab selected={{ id: '1' }} user={{ email: 'me' }} />)
    const input = await screen.findByRole('textbox')
    const button = screen.getByRole('button')
    fireEvent.change(input, { target: { value: 'Новое сообщение' } })
    fireEvent.click(button)
    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled()
      expect(screen.getByText('Новое сообщение')).toBeInTheDocument()
    })
  })
})

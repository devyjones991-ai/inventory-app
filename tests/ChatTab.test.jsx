import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChatTab from '../src/components/ChatTab.jsx'

const { supabaseMock, insertMock, initialMessages, sendMessageMock } =
  vi.hoisted(() => {
    const initialMessages = [
      {
        id: '1',
        object_id: '1',
        sender: 'me@example.com',
        content: 'Привет',
        created_at: new Date().toISOString(),
        read_at: new Date().toISOString(),
      },
      {
        id: '2',
        object_id: '1',
        sender: 'other@example.com',
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

    const updateMock = vi.fn(() => ({
      is: vi.fn(() => ({
        eq: vi.fn(() => ({
          neq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    }))

    const fromMock = vi.fn(() => ({
      select: selectMock,
      insert: insertMock,
      update: updateMock,
    }))

    const channelMock = vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }))

    const removeChannelMock = vi.fn()

    const supabaseMock = {
      from: fromMock,
      channel: channelMock,
      removeChannel: removeChannelMock,
    }

    const sendMessageMock = vi.fn(() =>
      Promise.resolve({ data: { id: '4' }, error: null }),
    )

    return { supabaseMock, insertMock, initialMessages, sendMessageMock }
  })

vi.mock('../src/supabaseClient.js', () => ({ supabase: supabaseMock }))
vi.mock('../src/hooks/useChatMessages.js', () => ({
  useChatMessages: () => ({ sendMessage: sendMessageMock }),
}))

describe('ChatTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('отображает сообщения и корректно определяет свои по e-mail', async () => {
    render(<ChatTab selected={{ id: '1' }} userEmail="me@example.com" />)

    for (const msg of initialMessages) {
      expect(await screen.findByText(msg.content)).toBeInTheDocument()
    }


    const firstFooter = (await screen.findByText(initialMessages[0].content))
      .closest('.chat')
      .querySelector('.text-xs')
    expect(firstFooter.textContent).toContain('✓')

    const secondFooter = (await screen.findByText(initialMessages[1].content))
      .closest('.chat')
      .querySelector('.text-xs')
    expect(secondFooter.textContent).not.toContain('✓')

    const myBubble = await screen.findByText('Привет')
    expect(myBubble.closest('.chat')).toHaveClass('chat-end')

    const otherBubble = await screen.findByText('Здравствуйте')
    expect(otherBubble.closest('.chat')).toHaveClass('chat-start')


    const textarea = screen.getByPlaceholderText(
      'Напиши сообщение… (Enter — отправить, Shift+Enter — новая строка)',
    )
    fireEvent.change(textarea, { target: { value: 'Новое сообщение' } })

    fireEvent.click(screen.getByText('Отправить'))

    await waitFor(() => expect(insertMock).toHaveBeenCalled())
    expect(textarea.value).toBe('')
  })

  it('отправляет файл с указанием e-mail отправителя', async () => {
    const { container } = render(

      <ChatTab selected={{ id: '1' }} userEmail="me" />,

      <ChatTab selected={{ id: '1' }} userEmail="me@example.com" />,

    )

    const fileInput = container.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()

    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByText('Отправить'))

    await waitFor(() => expect(sendMessageMock).toHaveBeenCalled())
    expect(sendMessageMock.mock.calls[0][0]).toMatchObject({
      file,
      sender: 'me@example.com',
    })
    expect(fileInput.value).toBe('')
  })
})

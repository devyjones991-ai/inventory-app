import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import ChatTab from '../src/components/ChatTab.jsx'

const mockMessages = [
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

var mockInsert
var mockSendMessage

jest.mock('../src/supabaseClient.js', () => {
  const mockSelect = jest.fn(() => ({
    eq: jest.fn(() => ({
      order: jest.fn(() =>
        Promise.resolve({ data: mockMessages, error: null }),
      ),
    })),
  }))
  mockInsert = jest.fn(() =>
    Promise.resolve({ data: { id: '3' }, error: null }),
  )
  const mockUpdate = jest.fn(() => ({
    is: jest.fn(() => ({
      eq: jest.fn(() => ({
        neq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  }))
  const mockFrom = jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  }))
  const mockChannel = jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
  }))
  const mockRemoveChannel = jest.fn()
  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
  }
})

jest.mock('../src/hooks/useChatMessages.js', () => {
  mockSendMessage = jest.fn(() =>
    Promise.resolve({ data: { id: '4' }, error: null }),
  )
  return { useChatMessages: () => ({ sendMessage: mockSendMessage }) }
})

describe('ChatTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
    globalThis.URL.createObjectURL = jest.fn(() => 'blob:preview')
    globalThis.URL.revokeObjectURL = jest.fn()
  })

  it('отображает сообщения и корректно определяет свои по e-mail', async () => {
    render(<ChatTab selected={{ id: '1' }} userEmail="me@example.com" />)

    for (const msg of mockMessages) {
      expect(await screen.findByText(msg.content)).toBeInTheDocument()
    }

    const firstFooter = (await screen.findByText(mockMessages[0].content))
      .closest('.chat')
      .querySelector('.text-xs')
    expect(firstFooter.textContent).toContain('✓')

    const secondFooter = (await screen.findByText(mockMessages[1].content))
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

    await waitFor(() => expect(mockInsert).toHaveBeenCalled())
    expect(textarea.value).toBe('')
  })

  it('отправляет файл с указанием e-mail отправителя', async () => {
    const { container } = render(
      <ChatTab selected={{ id: '1' }} userEmail="me@example.com" />,
    )

    const labelButton = screen.getByRole('button', { name: 'Прикрепить файл' })
    expect(labelButton).toBeInTheDocument()

    const labelIcon = container.querySelector(
      'label[data-testid="file-label"] svg',
    )
    expect(labelIcon).toBeInTheDocument()

    const fileInput = container.querySelector('input[type="file"]')
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    fireEvent.click(screen.getByText('Отправить'))

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalled())
    expect(mockSendMessage.mock.calls[0][0]).toMatchObject({
      file,
      sender: 'me@example.com',
    })
    expect(fileInput.value).toBe('')
  })
})

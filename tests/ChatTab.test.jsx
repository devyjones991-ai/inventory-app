import { render, fireEvent, waitFor, screen, act } from '@testing-library/react'
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
var mockFetchMessages

jest.mock('../src/supabaseClient.js', () => {
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
    insert: mockInsert,
    update: mockUpdate,
  }))
  const mockChannel = jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn((cb) => {
      cb('SUBSCRIBED')
      return { unsubscribe: jest.fn() }
    }),
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
  mockFetchMessages = jest.fn(() =>
    Promise.resolve({ data: mockMessages, error: null }),
  )
  return {
    useChatMessages: () => ({
      fetchMessages: mockFetchMessages,
    }),
  }
})

describe('ChatTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchMessages.mockReset()
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
    globalThis.URL.createObjectURL = jest.fn(() => 'blob:preview')
    globalThis.URL.revokeObjectURL = jest.fn()
    mockFetchMessages.mockResolvedValue({ data: mockMessages, error: null })
  })

  it('отображает последнее сообщение после загрузки', async () => {
    const manyMessages = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      object_id: '1',
      sender: 'other@example.com',
      content: `msg${i + 1}`,
      created_at: new Date(Date.now() + i).toISOString(),
    }))
    mockFetchMessages.mockResolvedValueOnce({ data: manyMessages, error: null })

    render(<ChatTab selected={{ id: '1' }} userEmail="me@example.com" />)

    expect(await screen.findByText('msg25')).toBeInTheDocument()
  })

  it('автоскроллит контейнер вниз при загрузке длинного списка сообщений', async () => {
    const manyMessages = Array.from({ length: 50 }, (_, i) => ({
      id: `${i + 1}`,
      object_id: '1',
      sender: 'other@example.com',
      content: `msg${i + 1}`,
      created_at: new Date(Date.now() + i).toISOString(),
    }))
    mockFetchMessages.mockResolvedValueOnce({ data: manyMessages, error: null })

    let scrollTop = 0
    const scrollTopSetter = jest.fn((v) => {
      scrollTop = v
    })
    const originalScrollTop = Object.getOwnPropertyDescriptor(
      window.HTMLElement.prototype,
      'scrollTop',
    )
    const originalScrollHeight = Object.getOwnPropertyDescriptor(
      window.HTMLElement.prototype,
      'scrollHeight',
    )
    const originalClientHeight = Object.getOwnPropertyDescriptor(
      window.HTMLElement.prototype,
      'clientHeight',
    )

    Object.defineProperty(window.HTMLElement.prototype, 'scrollTop', {
      configurable: true,
      get: () => scrollTop,
      set: scrollTopSetter,
    })
    Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', {
      configurable: true,
      get: () => 1000,
    })
    Object.defineProperty(window.HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get: () => 100,
    })

    const { container } = render(
      <ChatTab selected={{ id: '1' }} userEmail="me@example.com" />,
    )

    expect(await screen.findByText('msg50')).toBeInTheDocument()

    const scrollContainer = container.querySelector('.flex-1.overflow-y-auto')
    expect(scrollTopSetter).toHaveBeenCalled()
    expect(scrollContainer.scrollTop).toBe(scrollContainer.scrollHeight)

    if (originalScrollTop)
      Object.defineProperty(
        window.HTMLElement.prototype,
        'scrollTop',
        originalScrollTop,
      )
    else delete window.HTMLElement.prototype.scrollTop
    if (originalScrollHeight)
      Object.defineProperty(
        window.HTMLElement.prototype,
        'scrollHeight',
        originalScrollHeight,
      )
    else delete window.HTMLElement.prototype.scrollHeight
    if (originalClientHeight)
      Object.defineProperty(
        window.HTMLElement.prototype,
        'clientHeight',
        originalClientHeight,
      )
    else delete window.HTMLElement.prototype.clientHeight
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

    await waitFor(() => expect(mockInsert).toHaveBeenCalled())
    expect(mockInsert.mock.calls[0][0][0]).toMatchObject({
      sender: 'me@example.com',
    })
    expect(fileInput.value).toBe('')
  })

  it('подгружает дополнительные сообщения по кнопке', async () => {
    const page1 = Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      object_id: '1',
      sender: 'other@example.com',
      content: `msg${i + 1}`,
      created_at: new Date(Date.now() + i).toISOString(),
    }))
    const page2 = [
      {
        id: '21',
        object_id: '1',
        sender: 'other@example.com',
        content: 'msg21',
        created_at: new Date().toISOString(),
      },
    ]
    mockFetchMessages
      .mockResolvedValueOnce({ data: page1, error: null })
      .mockResolvedValueOnce({ data: page2, error: null })

    render(<ChatTab selected={{ id: '1' }} userEmail="me@example.com" />)

    const loadBtn = await screen.findByText('Загрузить ещё')
    fireEvent.click(loadBtn)

    await waitFor(() => expect(mockFetchMessages).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('msg21')).toBeInTheDocument()
  })

  it('фильтрует сообщения по поиску и показывает предупреждение при отсутствии', async () => {
    jest.useFakeTimers()
    mockFetchMessages.mockResolvedValueOnce({ data: mockMessages, error: null })
    render(<ChatTab selected={{ id: '1' }} userEmail="me@example.com" />)
    await screen.findByText('Привет')

    const searchBtn = screen.getByRole('button', { name: 'Поиск' })
    fireEvent.click(searchBtn)
    const searchInput = screen.getByPlaceholderText('Поиск сообщений')

    const filtered = [mockMessages[0]]
    mockFetchMessages.mockResolvedValueOnce({ data: filtered, error: null })
    fireEvent.change(searchInput, { target: { value: 'Прив' } })
    act(() => {
      jest.advanceTimersByTime(300)
    })
    await waitFor(() =>
      expect(mockFetchMessages).toHaveBeenLastCalledWith(
        '1',
        expect.objectContaining({ search: 'Прив' }),
      ),
    )
    await waitFor(() =>
      expect(screen.queryByText('Здравствуйте')).not.toBeInTheDocument(),
    )
    expect(await screen.findByText('Привет')).toBeInTheDocument()

    mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })
    fireEvent.change(searchInput, { target: { value: 'Не найдено' } })
    act(() => {
      jest.advanceTimersByTime(300)
    })
    await waitFor(() =>
      expect(mockFetchMessages).toHaveBeenLastCalledWith(
        '1',
        expect.objectContaining({ search: 'Не найдено' }),
      ),
    )
    expect(await screen.findByText('Сообщения не найдены')).toBeInTheDocument()

    fireEvent.click(searchBtn)
    expect(
      screen.queryByPlaceholderText('Поиск сообщений'),
    ).not.toBeInTheDocument()
    jest.useRealTimers()
  })
})

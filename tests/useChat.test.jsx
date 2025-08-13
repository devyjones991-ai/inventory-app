import { renderHook, act, waitFor } from '@testing-library/react'
import useChat from '../src/hooks/useChat.js'

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

const mockInsert = jest.fn(() =>
  Promise.resolve({ data: { id: '3' }, error: null }),
)

const mockFetchMessages = jest.fn(() =>
  Promise.resolve({ data: initialMessages, error: null }),
)

const mockSendMessage = jest.fn(() =>
  Promise.resolve({ data: { id: '4' }, error: null }),
)

jest.mock('../src/supabaseClient.js', () => {
  const mockUpdate = jest.fn(() => ({
    is: jest.fn(() => ({
      eq: jest.fn(() => ({
        neq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  }))
  const mockFrom = jest.fn(() => ({ insert: mockInsert, update: mockUpdate }))
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

jest.mock('../src/hooks/useChatMessages.js', () => ({
  useChatMessages: () => ({
    sendMessage: mockSendMessage,
    fetchMessages: mockFetchMessages,
  }),
}))

jest.mock('../src/utils/handleSupabaseError', () => ({
  handleSupabaseError: jest.fn(),
}))

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.URL.createObjectURL = jest.fn(() => 'blob:preview')
    globalThis.URL.revokeObjectURL = jest.fn()
    mockFetchMessages.mockResolvedValue({ data: initialMessages, error: null })
  })

  it('загружает сообщения при инициализации', async () => {
    const { result } = renderHook(() =>
      useChat({ objectId: '1', userEmail: 'me@example.com' }),
    )

    await waitFor(() =>
      expect(result.current.messages).toEqual(initialMessages),
    )
    expect(mockFetchMessages).toHaveBeenCalled()
  })

  it('отправляет текстовое сообщение', async () => {
    const { result } = renderHook(() =>
      useChat({ objectId: '1', userEmail: 'me@example.com' }),
    )

    await act(async () => {
      result.current.setNewMessage('Новое')
    })
    await act(async () => {
      await result.current.handleSend()
    })

    await waitFor(() => expect(mockInsert).toHaveBeenCalled())
    expect(result.current.newMessage).toBe('')
  })

  it('отправляет файл', async () => {
    const { result } = renderHook(() =>
      useChat({ objectId: '1', userEmail: 'me@example.com' }),
    )
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })

    await act(async () => {
      result.current.setFile(file)
    })
    await act(async () => {
      await result.current.handleSend()
    })

    await waitFor(() => expect(mockSendMessage).toHaveBeenCalled())
    expect(result.current.file).toBe(null)
  })
})

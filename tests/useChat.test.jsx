import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import useChat from '../src/hooks/useChat.js'

const mockInitialMessages = [
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

const mockSelectMock = jest.fn(() => ({
  eq: jest.fn(() => ({
    order: jest.fn(() =>
      Promise.resolve({ data: mockInitialMessages, error: null }),
    ),
  })),
}))

const mockInsertMock = jest.fn(() =>
  Promise.resolve({ data: { id: '3' }, error: null }),
)

const mockUpdateMock = jest.fn(() => ({
  is: jest.fn(() => ({
    eq: jest.fn(() => ({
      neq: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  })),
}))

const mockFromMock = jest.fn(() => ({
  select: mockSelectMock,
  insert: mockInsertMock,
  update: mockUpdateMock,
}))

const mockChannelMock = jest.fn(() => ({
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn((cb) => {
    cb && cb('SUBSCRIBED')
  }),
}))

const mockRemoveChannelMock = jest.fn()

const mockSupabase = {
  from: mockFromMock,
  channel: mockChannelMock,
  removeChannel: mockRemoveChannelMock,
}

const mockSendMessage = jest.fn(() =>
  Promise.resolve({ data: { id: '4' }, error: null }),
)

const mockUseChatMessages = {
  sendMessage: mockSendMessage,
}

jest.mock('../src/supabaseClient.js', () => ({ supabase: mockSupabase }))
jest.mock('../src/hooks/useChatMessages.js', () => ({
  useChatMessages: () => mockUseChatMessages,
}))
jest.mock('../src/utils/handleSupabaseError', () => ({
  handleSupabaseError: jest.fn(),
}))

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useChat('1'))
    expect(result.current.isLoading).toBe(true)
    expect(result.current.messages).toEqual([])
    expect(result.current.newMessage).toBe('')
  })

  it('should load initial messages', async () => {
    const { result } = renderHook(() =>
      useChat({ objectId: '1', userEmail: 'me@example.com' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.messages).toEqual(mockInitialMessages)
  })

  it('should send messages', async () => {
    const { result } = renderHook(() =>
      useChat({ objectId: '1', userEmail: 'me@example.com' }),
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.sendMessage('Новое сообщение', 'user@example.com')
    })

    expect(mockSendMessage).toHaveBeenCalledWith({
      object_id: '1',
      content: 'Новое сообщение',
      sender: 'user@example.com',
    })
  })

  it('should mark messages as read', async () => {
    const { result } = renderHook(() => useChat('1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      result.current.markAsRead()
    })

    expect(mockFromMock).toHaveBeenCalledWith('messages')
  })

  it('should handle real-time updates', async () => {
    const { result } = renderHook(() => useChat('1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockChannelMock).toHaveBeenCalledWith('messages:1')
  })
})

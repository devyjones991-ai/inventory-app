// Move mocks before imports to avoid initialization errors
const mockError = new Error('update failed')

// Mock Supabase client first
const updateChain = {
  is: jest.fn(() => ({
    eq: jest.fn(() => ({
      neq: jest.fn(() => Promise.resolve({ data: null, error: mockError })),
    })),
  })),
}

const mockSupabase = {
  from: jest.fn(() => ({ update: jest.fn(() => updateChain) })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
  })),
  removeChannel: jest.fn(),
}

jest.mock('../src/supabaseClient.js', () => ({
  supabase: mockSupabase
}))

jest.mock('../src/utils/handleSupabaseError', () => ({
  handleSupabaseError: jest.fn(),
}))

// Test data
const page1 = [
  {
    id: '1',
    object_id: '1',
    sender: 'a',
    content: 'm1',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    object_id: '1',
    sender: 'b',
    content: 'm2',
    created_at: new Date().toISOString(),
  },
]
const page2 = [
  {
    id: '3',
    object_id: '1',
    sender: 'a',
    content: 'm3',
    created_at: new Date().toISOString(),
  },
]

const mockFetchMessages = jest
  .fn()
  .mockResolvedValueOnce({ data: page1, error: null })
  .mockResolvedValueOnce({ data: page2, error: null })
const mockSendMessage = jest.fn()

// Mock the useChatMessages hook
jest.mock('../src/hooks/useChatMessages.js', () => ({
  useChatMessages: () => ({
    fetchMessages: mockFetchMessages,
    sendMessage: mockSendMessage,
  }),
}))

// Now import the components
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import useChat from '../src/hooks/useChat.js'
import { handleSupabaseError as mockHandleSupabaseError } from '../src/utils/handleSupabaseError'

describe('useChat markMessagesAsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('загружает сообщения с учётом смещения без аргументов', async () => {
    const { result } = renderHook(() =>
      useChat({ objectId: '1', userEmail: 'me@example.com' }),
    )

    await waitFor(() => expect(mockFetchMessages).toHaveBeenCalledTimes(1))
    expect(mockFetchMessages).toHaveBeenCalledWith('1', {
      limit: 20,
      offset: 0,
    })

    await act(async () => {
      await result.current.loadMore()
    })

    expect(mockFetchMessages).toHaveBeenCalledTimes(2)
    expect(mockFetchMessages).toHaveBeenLastCalledWith('1', {
      limit: 20,
      offset: page1.length,
    })
    expect(result.current.messages).toHaveLength(page1.length + page2.length)
  })

  it('обрабатывает ошибку при отметке сообщений прочитанными', async () => {
    renderHook(() => useChat({ objectId: '1', userEmail: 'me@example.com' }))

    await waitFor(() => {
      expect(mockHandleSupabaseError).toHaveBeenCalledWith(
        mockError,
        null,
        'Ошибка отметки сообщений как прочитанных',
      )
    })
  })
})

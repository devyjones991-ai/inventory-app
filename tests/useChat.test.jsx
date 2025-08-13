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

var mockSelect
var mockInsert
var mockFrom
var mockChannel
var mockRemoveChannel
var mockSupabase
var mockSendMessage

jest.mock('../src/supabaseClient.js', () => {
  mockSelect = jest.fn(() => ({
    eq: jest.fn(() => ({
      order: jest.fn(() =>
        Promise.resolve({ data: mockInitialMessages, error: null }),
      ),
    })),
  }))

  const mockUpdate = jest.fn(() => ({
    is: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  }))

  mockInsert = jest.fn(() =>
    Promise.resolve({ data: { id: '3' }, error: null }),
  )

  mockFrom = jest.fn((table) => {
    if (table === 'messages') {
      return {
        select: mockSelect,
        insert: mockInsert,
        update: mockUpdate,
      }
    }
    return {
      select: jest.fn(() => ({ eq: jest.fn() })),
      insert: jest.fn(),
      update: jest.fn(),
    }
  })

  mockChannel = jest.fn(() => ({
    on: jest.fn(() => ({
      subscribe: jest.fn(() => ({
        unsubscribe: jest.fn(),
      })),
    })),
  }))

  mockRemoveChannel = jest.fn()

  mockSupabase = {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }

  return { supabase: mockSupabase }
})

jest.mock('../src/api/messages.js', () => ({
  sendMessage: (mockSendMessage = jest.fn(() =>
    Promise.resolve({ data: { id: '4' }, error: null }),
  )),
}))

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with empty messages', async () => {
    const { result } = renderHook(() => useChat('1'))

    expect(result.current.messages).toEqual([])
    expect(result.current.isLoading).toBe(true)
  })

  it('should fetch messages on mount', async () => {
    const { result } = renderHook(() => useChat('1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.messages).toEqual(mockInitialMessages)
    expect(mockFrom).toHaveBeenCalledWith('messages')
    expect(mockSelect).toHaveBeenCalled()
  })

  it('should send a message', async () => {
    const { result } = renderHook(() => useChat('1'))

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

    expect(mockFrom).toHaveBeenCalledWith('messages')
  })

  it('should handle real-time updates', async () => {
    const { result } = renderHook(() => useChat('1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockChannel).toHaveBeenCalledWith('messages:1')
  })
})

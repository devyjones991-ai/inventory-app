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
      eq: jest.fn(() => ({
        neq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  }))

  mockInsert = jest.fn(() =>
    Promise.resolve({ data: { id: '3' }, error: null }),
  )

  mockFrom = jest.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
  }))

  mockChannel = jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn((cb) => {
      cb && cb('SUBSCRIBED')
    }),
  }))

  mockRemoveChannel = jest.fn()

  mockSupabase = {
    from: mockFrom,
    channel: mockChannel,
    removeChannel: mockRemoveChannel,
  }

  return { supabase: mockSupabase }
})

jest.mock('../src/hooks/useChatMessages.js', () => {
  mockSendMessage = jest.fn(() =>
    Promise.resolve({ data: { id: '4' }, error: null }),
  )
  return {
    useChatMessages: () => ({ sendMessage: mockSendMessage }),
  }
})

jest.mock('../src/utils/handleSupabaseError', () => ({
  handleSupabaseError: jest.fn(),
}))

describe('useChat', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    globalThis.URL.createObjectURL = jest.fn(() => 'blob:preview')
    globalThis.URL.revokeObjectURL = jest.fn()
  })

  it('загружает сообщения при инициализации', async () => {
    const { result } = renderHook(() =>
      useChat({ objectId: '1', userEmail: 'me@example.com' }),
    )

    await waitFor(() =>
      expect(result.current.messages).toEqual(mockInitialMessages),
    )
    expect(mockSelect).toHaveBeenCalled()
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

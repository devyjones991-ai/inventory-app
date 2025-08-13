import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import useChat from '../src/hooks/useChat.js'

const {
  supabaseMock,
  insertMock,
  initialMessages,
  sendMessageMock,
  selectMock,
} = vi.hoisted(() => {
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
    subscribe: vi.fn((cb) => {
      cb && cb('SUBSCRIBED')
    }),
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

  return {
    supabaseMock,
    insertMock,
    initialMessages,
    sendMessageMock,
    selectMock,
  }
})

vi.mock('../src/supabaseClient.js', () => ({ supabase: supabaseMock }))
vi.mock('../src/hooks/useChatMessages.js', () => ({
  useChatMessages: () => ({ sendMessage: sendMessageMock }),
}))
vi.mock('../src/utils/handleSupabaseError', () => ({
  handleSupabaseError: vi.fn(),
}))

describe('useChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:preview')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('загружает сообщения при инициализации', async () => {
    const { result } = renderHook(() =>
      useChat({ objectId: '1', userEmail: 'me@example.com' }),
    )

    await waitFor(() =>
      expect(result.current.messages).toEqual(initialMessages),
    )
    expect(selectMock).toHaveBeenCalled()
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

    await waitFor(() => expect(insertMock).toHaveBeenCalled())
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

    await waitFor(() => expect(sendMessageMock).toHaveBeenCalled())
    expect(result.current.file).toBe(null)
  })
})

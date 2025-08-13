import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

const mockError = new Error('update failed')

jest.mock('../src/supabaseClient.js', () => {
  const update = jest.fn(() => ({
    is: jest.fn(() => ({
      eq: jest.fn(() => ({
        neq: jest.fn(() => Promise.resolve({ data: null, error: mockError })),
      })),
    })),
  }))
  const from = jest.fn(() => ({ update }))
  const channel = jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
  }))
  const removeChannel = jest.fn()
  return {
    supabase: { from, channel, removeChannel },
  }
})

const mockFetchMessages = jest.fn().mockResolvedValue({ data: [], error: null })
const mockSendMessage = jest.fn().mockResolvedValue({ data: {}, error: null })

jest.mock('../src/hooks/useChatMessages.js', () => ({
  useChatMessages: () => ({
    fetchMessages: mockFetchMessages,
    sendMessage: mockSendMessage,
  }),
}))

jest.mock('../src/utils/handleSupabaseError', () => ({
  handleSupabaseError: jest.fn(),
}))

import useChat from '../src/hooks/useChat.js'
import { handleSupabaseError as mockHandleSupabaseError } from '../src/utils/handleSupabaseError'

describe('useChat markMessagesAsRead', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { useChatMessages } from '../src/hooks/useChatMessages.js'

var mockUpload
var mockGetPublicUrl
var mockStorageFrom
var mockInsert
var mockSupabaseFrom

jest.mock('../src/supabaseClient.js', () => {
  mockUpload = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockGetPublicUrl = jest.fn(() => ({ data: { publicUrl: 'url' } }))
  mockStorageFrom = jest.fn(() => ({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  }))
  mockInsert = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockSupabaseFrom = jest.fn(() => ({ insert: mockInsert }))
  return {
    supabase: {
      storage: { from: mockStorageFrom },
      from: mockSupabaseFrom,
    },
  }
})

describe('useChatMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('не загружает файлы с неподдерживаемым типом', async () => {
    const { sendMessage } = useChatMessages()
    const file = new File(['data'], 'test.bin', {
      type: 'application/octet-stream',
    })
    const { error } = await sendMessage({
      objectId: '1',
      sender: 'user@example.com',
      content: 'msg',
      file,
    })
    expect(error).toBeDefined()
    expect(mockUpload).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('не загружает файлы, превышающие лимит размера', async () => {
    const { sendMessage } = useChatMessages()
    const big = new Uint8Array(6 * 1024 * 1024)
    const file = new File([big], 'big.png', { type: 'image/png' })
    const { error } = await sendMessage({
      objectId: '1',
      sender: 'user@example.com',
      content: 'msg',
      file,
    })
    expect(error).toBeDefined()
    expect(mockUpload).not.toHaveBeenCalled()
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

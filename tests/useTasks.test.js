import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import { useTasks } from '../src/hooks/useTasks.js'
import { handleSupabaseError as mockHandleSupabaseError } from '../src/utils/handleSupabaseError'

jest.mock('../src/utils/handleSupabaseError', () => ({
  handleSupabaseError: jest.fn(),
}))

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}))

var mockSingle
var mockSelect
var mockInsert
var mockFrom

jest.mock('../src/supabaseClient.js', () => {
  mockSingle = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockSelect = jest.fn(() => ({ single: mockSingle }))
  mockInsert = jest.fn(() => ({ select: mockSelect }))
  mockFrom = jest.fn(() => ({ insert: mockInsert }))
  return { supabase: { from: mockFrom } }
})

describe('useTasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('обрабатывает ошибку добавления задачи', async () => {
    const mockError = new Error('fail')
    mockSingle.mockResolvedValueOnce({ data: null, error: mockError })
    const { result } = renderHook(() => useTasks())
    const { error } = await result.current.insertTask({ title: 't' })
    expect(error).toBe(mockError)
    expect(mockHandleSupabaseError).toHaveBeenCalledWith(
      mockError,
      expect.any(Function),
      'Ошибка добавления задачи',
    )
  })
})

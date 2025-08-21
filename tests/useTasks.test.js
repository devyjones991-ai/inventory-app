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
var mockEq
var mockOrder
var mockRangeOrder
var mockRangeBase

jest.mock('../src/supabaseClient.js', () => {
  mockSingle = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockRangeOrder = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockRangeBase = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockOrder = jest.fn(() => ({ range: mockRangeOrder }))
  mockEq = jest.fn(() => ({ order: mockOrder, range: mockRangeBase }))
  mockSelect = jest.fn(() => ({ single: mockSingle, eq: mockEq }))
  mockInsert = jest.fn(() => ({ select: mockSelect }))
  mockFrom = jest.fn(() => ({ insert: mockInsert, select: mockSelect }))
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

  it('успешно загружает задачи при ошибке schema cache', async () => {
    mockRangeOrder
      .mockResolvedValueOnce({
        data: null,
        error: { code: '42703' },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 1,
            title: 't',
            assignee: 'a',
            assignee_id: 10,
            created_at: '2024-05-09T00:00:00Z',
          },
        ],
        error: null,
      })

    const { result } = renderHook(() => useTasks())
    const { data, error } = await result.current.fetchTasks(1, 0, 20)
    expect(error).toBeNull()
    expect(data).toEqual([
      {
        id: 1,
        title: 't',
        assignee: 'a',
        assignee_id: 10,
        created_at: '2024-05-09T00:00:00Z',
      },
    ])
    expect(mockSelect).toHaveBeenCalledTimes(1)
    expect(mockOrder).toHaveBeenCalledTimes(2)
    expect(mockRangeOrder).toHaveBeenCalledTimes(2)
    expect(mockRangeBase).toHaveBeenCalledTimes(0)
  })
})

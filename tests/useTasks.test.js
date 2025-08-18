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

jest.mock('../src/supabaseClient.js', () => {
  mockSingle = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockOrder = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockEq = jest.fn(() => ({ order: mockOrder }))
  mockSelect = jest.fn(() => ({
    single: mockSingle,
    eq: mockEq,
    order: mockOrder,
  }))
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

  it('повторно запрашивает задачи при отсутствии assignee_id', async () => {
    mockOrder
      .mockResolvedValueOnce({ data: null, error: { code: '42703' } })
      .mockResolvedValueOnce({
        data: [{ id: 1, title: 't', assignee: 'a', executor: 'e' }],
        error: null,
      })

    const { result } = renderHook(() => useTasks())
    const { data, error } = await result.current.fetchTasks(1)
    expect(error).toBeNull()
    expect(data).toEqual([
      {
        id: 1,
        title: 't',
        assignee: 'a',
        executor: 'e',
        assignee_id: null,
        executor_id: null,
      },
    ])
    expect(mockSelect).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('assignee_id'),
    )
    expect(mockSelect).toHaveBeenNthCalledWith(
      2,
      expect.not.stringContaining('assignee_id'),
    )
    expect(mockHandleSupabaseError).not.toHaveBeenCalled()
  })
})

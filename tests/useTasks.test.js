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
var mockEqResults

jest.mock('../src/supabaseClient.js', () => {
  mockEqResults = []
  mockSingle = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockOrder = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockEq = jest.fn(() => {
    const res = mockEqResults.shift() || { data: null, error: null }
    const thenable = {
      order: mockOrder,
      then: (resolve) => resolve(res),
    }
    return thenable
  })
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
    mockEqResults = []
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
    mockOrder.mockResolvedValueOnce({ data: null, error: { code: '42703' } })
    mockEqResults.push({ data: null, error: { code: '42703' } })
    mockEqResults.push({
      data: [{ id: 1, title: 't', executor: 'e', executor_id: 5 }],
      error: null,
    })

    const { result } = renderHook(() => useTasks())
    const { data, error } = await result.current.fetchTasks(1)
    expect(error).toBeNull()
    expect(data).toEqual([
      {
        id: 1,
        title: 't',
        assignee: 'e',
        assignee_id: 5,
      },
    ])
    expect(mockSelect).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('assignee_id'),
    )
    expect(mockSelect).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('executor_id'),
    )
    expect(mockOrder).toHaveBeenCalledTimes(1)
    expect(mockHandleSupabaseError).not.toHaveBeenCalled()
  })

  it('использует fallback при устаревшем кеше схемы', async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: 'schema cache out of date' },
    })
    mockEqResults.push({
      data: null,
      error: { message: 'schema cache out of date' },
    })
    mockEqResults.push({
      data: [{ id: 1, title: 't', executor: 'e', executor_id: 5 }],
      error: null,
    })

    const { result } = renderHook(() => useTasks())
    const { data, error } = await result.current.fetchTasks(1)
    expect(error).toBeNull()
    expect(data).toEqual([
      {
        id: 1,
        title: 't',
        assignee: 'e',
        assignee_id: 5,
      },
    ])
    expect(mockSelect).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('assignee_id'),
    )
    expect(mockSelect).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('executor_id'),
    )
    expect(mockOrder).toHaveBeenCalledTimes(1)
    expect(mockHandleSupabaseError).not.toHaveBeenCalled()
  })

  it('успешно загружает задачи без created_at', async () => {
    mockOrder.mockResolvedValueOnce({ data: null, error: { code: '42703' } })
    mockEqResults.push({
      data: [
        {
          id: 1,
          title: 't',
          assignee: 'a',
          assignee_id: 10,
        },
      ],
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
        assignee_id: 10,
      },
    ])
    expect(mockSelect).toHaveBeenCalledTimes(1)
    expect(mockOrder).toHaveBeenCalledTimes(1)
  })
})

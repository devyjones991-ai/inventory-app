import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { renderHook } from '@testing-library/react'
import { useHardware } from '@/hooks/useHardware.js'
import { handleSupabaseError as mockHandleSupabaseError } from '@/utils/handleSupabaseError'

jest.mock('@/utils/handleSupabaseError', () => ({
  handleSupabaseError: jest.fn(),
}))

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}))

var mockOrder
var mockEq
var mockSelect
var mockFrom

jest.mock('@/supabaseClient.js', () => {
  mockOrder = jest.fn(() => Promise.resolve({ data: null, error: null }))
  mockEq = jest.fn(() => ({ order: mockOrder }))
  mockSelect = jest.fn(() => ({ eq: mockEq }))
  mockFrom = jest.fn(() => ({ select: mockSelect }))
  return { supabase: { from: mockFrom } }
})

describe('useHardware', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('обрабатывает ошибку загрузки оборудования', async () => {
    const mockError = new Error('fail')
    mockOrder.mockResolvedValueOnce({ data: null, error: mockError })
    const { result } = renderHook(() => useHardware())
    const { error } = await result.current.fetchHardware('1')
    expect(error).toBe(mockError)
    expect(mockHandleSupabaseError).toHaveBeenCalledWith(
      mockError,
      expect.any(Function),
      'Ошибка загрузки оборудования',
    )
  })
})

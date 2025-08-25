import { describe, it, expect, jest } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'
import { useSupabaseQuery } from '../src/utils/useSupabaseQuery.js'

describe('useSupabaseQuery', () => {
  it('не выставляет ошибку при отмене запроса', async () => {
    const queryBuilder = jest.fn(
      (_, signal) =>
        new Promise((resolve, reject) => {
          signal.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          )
        }),
    )

    const { result, unmount } = renderHook(() => useSupabaseQuery(queryBuilder))
    const signal = queryBuilder.mock.calls[0][1]
    expect(signal.aborted).toBe(false)

    await act(async () => {
      unmount()
      await Promise.resolve()
    })

    expect(signal.aborted).toBe(true)
    expect(result.current.isError).toBeNull()
  })
})

import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, jest } from '@jest/globals'
import { useContext } from 'react'
import { AuthProvider, AuthContext } from '../src/context/AuthContext'
import { toast } from 'react-hot-toast'

const mockGetSession = jest.fn()
const mockOnAuthStateChange = jest.fn()

jest.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
    },
  },
  isSupabaseConfigured: true,
}))

mockGetSession.mockResolvedValue({
  data: { session: { user: { id: '123' } } },
})

mockOnAuthStateChange.mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
})

function Consumer() {
  const { role } = useContext(AuthContext)
  return <div>{role ?? 'без роли'}</div>
}

describe('AuthContext', () => {
  it('логирует ошибку и оставляет роль null при сбое сети', async () => {
    const errorText = 'Ошибка сети'
    const originalFetch = globalThis.fetch
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.reject(new Error('not json')),
        text: () => Promise.resolve(errorText),
        clone() {
          return this
        },
      }),
    )
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(consoleSpy).toHaveBeenCalled())

    expect(consoleSpy).toHaveBeenCalledWith(
      'Ошибка получения роли:',
      expect.objectContaining({ message: errorText }),
    )

    expect(screen.getByText('без роли')).toBeInTheDocument()

    consoleSpy.mockRestore()
    globalThis.fetch = originalFetch
  })

  it('использует сообщение из JSON при ошибке API', async () => {
    const errorMessage = 'Нет доступа'
    const originalFetch = globalThis.fetch
    globalThis.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
        text: () => Promise.resolve(''),
        clone() {
          return this
        },
      }),
    )
    const toastSpy = jest.spyOn(toast, 'error').mockImplementation(() => {})

    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    await waitFor(() => expect(toastSpy).toHaveBeenCalled())

    expect(toastSpy).toHaveBeenCalledWith(
      'Ошибка получения роли: ' + errorMessage,
    )

    toastSpy.mockRestore()
    globalThis.fetch = originalFetch
  })
})

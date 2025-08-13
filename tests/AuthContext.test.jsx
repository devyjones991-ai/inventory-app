import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, jest } from '@jest/globals'
import { useContext } from 'react'
import { AuthProvider, AuthContext } from '../src/context/AuthContext.jsx'

const mockGetSession = jest.fn()
const mockOnAuthStateChange = jest.fn()

jest.mock('../src/supabaseClient.js', () => ({
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
        text: () => Promise.resolve(errorText),
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
})

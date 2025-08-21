import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mockFrom = jest.fn()
const mockSignUp = jest
  .fn()
  .mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
const mockGetSession = jest.fn(() =>
  Promise.resolve({ data: { session: null } }),
)
const mockOnAuthStateChange = jest.fn(() => ({
  data: { subscription: { unsubscribe: jest.fn() } },
}))

jest.mock('@/supabaseClient.js', () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
      signInWithPassword: jest.fn(),
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
    from: mockFrom,
  },
  isSupabaseConfigured: true,
}))

describe('AuthPage', () => {
  it('регистрирует пользователя без создания профиля', async () => {
    const AuthPage = (await import('@/pages/AuthPage.jsx')).default
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Нет аккаунта? Регистрация'))

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'password' },
    })
    fireEvent.change(screen.getByPlaceholderText('Имя пользователя'), {
      target: { value: 'testuser' },
    })

    fireEvent.click(screen.getByText('Зарегистрироваться'))

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled()
      expect(mockFrom).not.toHaveBeenCalled()
    })
  })
})

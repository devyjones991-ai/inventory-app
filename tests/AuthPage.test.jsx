import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const insertMock = vi.fn().mockResolvedValue({ error: null })
const signUpMock = vi
  .fn()
  .mockResolvedValue({ data: { user: { id: 'user-id' } }, error: null })
const getSessionMock = vi.fn(() => Promise.resolve({ data: { session: null } }))
const onAuthStateChangeMock = vi.fn(() => ({
  data: { subscription: { unsubscribe: vi.fn() } },
}))

vi.mock('@/supabaseClient.js', () => ({
  supabase: {
    auth: {
      signUp: signUpMock,
      signInWithPassword: vi.fn(),
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
    },
    from: vi.fn(() => ({ insert: insertMock })),
  },
  isSupabaseConfigured: true,
}))

describe('AuthPage', () => {
  it('создает профиль при успешной регистрации', async () => {
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
      expect(signUpMock).toHaveBeenCalled()
      expect(insertMock).toHaveBeenCalledWith({
        id: 'user-id',
        username: 'testuser',
      })
    })
  })
})

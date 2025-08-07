import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/utils/notifications', () => ({
  requestNotificationPermission: vi.fn(),
  pushNotification: vi.fn(),
  playTaskSound: vi.fn(),
  playMessageSound: vi.fn(),
}))

const { signUpMock, getSessionMock, onAuthStateChangeMock } = vi.hoisted(() => {
  return {
    signUpMock: vi.fn(() =>
      Promise.resolve({ data: { user: { confirmed_at: null } }, error: null }),
    ),
    getSessionMock: vi.fn(() => Promise.resolve({ data: { session: null } })),
    onAuthStateChangeMock: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  }
})

vi.mock('@/supabaseClient.js', () => ({
  isSupabaseConfigured: true,
  supabase: {
    auth: {
      signUp: signUpMock,
      signInWithPassword: vi.fn(),
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: vi.fn(),
    },
  },
}))

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() },
}))

import { pushNotification } from '@/utils/notifications'
import AuthPage from '@/pages/AuthPage.jsx'

describe('AuthPage signUp confirmation', () => {
  it('показывает сообщение и уведомление при незавершённой регистрации', async () => {
    render(
      <MemoryRouter>
        <AuthPage />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Нет аккаунта? Регистрация'))
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Имя пользователя'), {
      target: { value: 'user' },
    })
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'password' },
    })
    fireEvent.click(screen.getByText('Зарегистрироваться'))

    expect(
      await screen.findByText('Проверьте почту для подтверждения аккаунта'),
    ).toBeInTheDocument()
    expect(pushNotification).toHaveBeenCalledWith(
      'Регистрация',
      'Проверьте почту для подтверждения аккаунта',
    )
  })
})

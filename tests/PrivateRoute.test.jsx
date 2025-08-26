import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from '@/components/PrivateRoute.jsx'
import { useAuth } from '@/hooks/useAuth.js'

jest.mock('@/hooks/useAuth.js', () => ({
  useAuth: jest.fn(),
}))

describe('PrivateRoute', () => {
  it('показывает индикатор загрузки во время ожидания', () => {
    useAuth.mockReturnValue({ user: null, isLoading: true })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <div>Секрет</div>
              </PrivateRoute>
            }
          />
          <Route path="/auth" element={<div>Вход</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('перенаправляет на страницу входа при отсутствии пользователя', () => {
    useAuth.mockReturnValue({ user: null, isLoading: false })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <div>Секрет</div>
              </PrivateRoute>
            }
          />
          <Route path="/auth" element={<div>Вход</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Вход')).toBeInTheDocument()
  })

  it('отображает содержимое для авторизованного пользователя', () => {
    useAuth.mockReturnValue({ user: { id: '1' }, isLoading: false })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <PrivateRoute>
                <div>Секрет</div>
              </PrivateRoute>
            }
          />
          <Route path="/auth" element={<div>Вход</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Секрет')).toBeInTheDocument()
  })
})

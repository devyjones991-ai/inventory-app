import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AdminRoute from '@/components/AdminRoute'

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

describe('AdminRoute', () => {
  it('перенаправляет неадминистратора на страницу входа', () => {
    useAuth.mockReturnValue({ isAdmin: false })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <AdminRoute>
                <div>Секрет</div>
              </AdminRoute>
            }
          />
          <Route path="/auth" element={<div>Вход</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Вход')).toBeInTheDocument()
  })

  it('показывает содержимое администраторам', () => {
    useAuth.mockReturnValue({ isAdmin: true })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route
            path="/"
            element={
              <AdminRoute>
                <div>Секрет</div>
              </AdminRoute>
            }
          />
          <Route path="/auth" element={<div>Вход</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Секрет')).toBeInTheDocument()
  })
})

import React from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

jest.mock('@/utils/notifications', () => ({
  requestNotificationPermission: jest.fn(),
  pushNotification: jest.fn(),
  playTaskSound: jest.fn(),
  playMessageSound: jest.fn(),
}))

const mockLoadError = new Error('load failed')

jest.mock('@/supabaseClient', () => {
  const channelMock = { on: jest.fn().mockReturnThis(), subscribe: jest.fn() }
  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getSession: jest.fn(() =>
          Promise.resolve({ data: { session: { user: {} } } }),
        ),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
      },
      channel: jest.fn(() => channelMock),
      removeChannel: jest.fn(),
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        order: jest
          .fn()
          .mockResolvedValue({ data: null, error: mockLoadError }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  }
})

jest.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: {} }),
}))

import { toast } from 'react-hot-toast'
import DashboardPage from '@/pages/DashboardPage'

describe('DashboardPage', () => {
  it('отображает ошибку при сбое загрузки объектов', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )
    expect(
      await screen.findByText('Ошибка загрузки объектов: load failed'),
    ).toBeInTheDocument()
    expect(toast.error).toHaveBeenCalledWith(
      'Ошибка загрузки объектов: load failed',
    )
  })
})

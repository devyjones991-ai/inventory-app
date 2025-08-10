import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('@/utils/notifications', () => ({
  requestNotificationPermission: vi.fn(),
  pushNotification: vi.fn(),
  playTaskSound: vi.fn(),
  playMessageSound: vi.fn(),
}))

const loadError = new Error('load failed')

vi.mock('@/supabaseClient.js', () => {
  const channelMock = { on: vi.fn().mockReturnThis(), subscribe: vi.fn() }
  return {
    isSupabaseConfigured: true,
    supabase: {
      auth: {
        getSession: vi.fn(() =>
          Promise.resolve({ data: { session: { user: {} } } }),
        ),
        onAuthStateChange: vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        })),
      },
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: loadError }),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    },
  }
})

vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/hooks/useAuth', () => ({
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

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, vi, expect } from 'vitest'
import ChatTab from '@/components/ChatTab.jsx'

const supabaseMock = vi.hoisted(() => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => ({ then: vi.fn() })),
      })),
    })),
  })),
  channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
  removeChannel: vi.fn(),
}))

vi.mock('@/supabaseClient.js', () => ({ supabase: supabaseMock }))

describe('ChatTab', () => {
  it('рендерит поле ввода и кнопку отправки', () => {
    render(<ChatTab selected={{ id: '1' }} />)
    expect(screen.getByPlaceholderText(/Напиши сообщение/)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /отправить/i }),
    ).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import AuditTrail from '@/features/dashboard/components/AuditTrail.jsx'

const { supabaseMock } = vi.hoisted(() => {
  const logs = [
    {
      id: '1',
      user_id: 'user-1',
      action: 'insert',
      target_table: 'tasks',
      target_id: 't1',
      meta: { title: 'Test' },
      created_at: '2024-01-01T00:00:00Z',
    },
  ]

  const limitMock = vi.fn(() => Promise.resolve({ data: logs, error: null }))
  const orderMock = vi.fn(() => ({ limit: limitMock }))
  const selectMock = vi.fn(() => ({ order: orderMock }))
  const fromMock = vi.fn(() => ({ select: selectMock }))

  return { supabaseMock: { from: fromMock }, logs }
})

vi.mock('@/supabaseClient.js', () => ({ supabase: supabaseMock }))

describe('AuditTrail', () => {
  it('отображает логи', async () => {
    render(<AuditTrail limit={10} />)
    expect(await screen.findByText('insert')).toBeInTheDocument()
    expect(screen.getByText('tasks')).toBeInTheDocument()
  })
})

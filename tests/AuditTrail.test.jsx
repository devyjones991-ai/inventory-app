import { render, screen } from '@testing-library/react'
import AuditTrail from '@/components/AuditTrail.jsx'

const mockLogs = [
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

jest.mock('@/supabaseClient.js', () => {
  const mockLimit = jest.fn(() =>
    Promise.resolve({ data: mockLogs, error: null }),
  )
  const mockOrder = jest.fn(() => ({ limit: mockLimit }))
  const mockSelect = jest.fn(() => ({ order: mockOrder }))
  return {
    supabase: { from: jest.fn(() => ({ select: mockSelect })) },
  }
})

describe('AuditTrail', () => {
  it('отображает логи', async () => {
    render(<AuditTrail limit={10} />)
    expect(await screen.findByText('insert')).toBeInTheDocument()
    expect(screen.getByText('tasks')).toBeInTheDocument()
  })
})

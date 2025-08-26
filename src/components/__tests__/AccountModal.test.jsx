/* eslint-env jest */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, jest, beforeEach } from '@jest/globals'

import AccountModal from '@/components/AccountModal.jsx'

const mockUpdate = jest.fn()

jest.mock('@/hooks/useAccount', () => ({
  useAccount: () => ({ updateProfile: mockUpdate }),
}))

jest.mock('react-hot-toast', () => ({ toast: { error: jest.fn() } }))

describe('AccountModal', () => {
  const user = { user_metadata: { username: 'old' } }

  beforeEach(() => {
    mockUpdate.mockResolvedValue({ data: { user }, error: null })
  })

  test('ставит фокус на поле и отменяет', async () => {
    const onClose = jest.fn()
    render(<AccountModal user={user} onClose={onClose} onUpdated={jest.fn()} />)

    expect(screen.getByLabelText('Никнейм')).toHaveFocus()

    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(onClose).toHaveBeenCalled()
  })

  test('сохраняет изменения', async () => {
    const onClose = jest.fn()
    const onUpdated = jest.fn()
    render(<AccountModal user={user} onClose={onClose} onUpdated={onUpdated} />)

    await userEvent.clear(screen.getByLabelText('Никнейм'))
    await userEvent.type(screen.getByLabelText('Никнейм'), 'newname')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(mockUpdate).toHaveBeenCalledWith({ username: 'newname' })
    expect(onUpdated).toHaveBeenCalledWith(user)
    expect(onClose).toHaveBeenCalled()
  })
})

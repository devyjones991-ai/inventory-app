/* eslint-env jest */

import { describe, test, expect, jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import AccountModal from '../AccountModal'

const mockUpdateProfile = jest.fn()

jest.mock('../../hooks/useAccount', () => ({
  useAccount: () => ({
    updateProfile: mockUpdateProfile,
  }),
}))

describe('AccountModal', () => {
  test('изменение никнейма и закрытие модалки', async () => {
    const user = { user_metadata: { username: 'старый' } }
    const onClose = jest.fn()
    const onUpdated = jest.fn()
    const updatedUser = { id: 1, user_metadata: { username: 'новый' } }

    mockUpdateProfile.mockResolvedValue({
      data: { user: updatedUser },
      error: null,
    })

    render(<AccountModal user={user} onClose={onClose} onUpdated={onUpdated} />)

    const input = screen.getByLabelText('Никнейм')
    fireEvent.change(input, { target: { value: 'новый' } })
    expect(input).toHaveValue('новый')

    fireEvent.click(screen.getByText('Сохранить'))

    await waitFor(() =>
      expect(mockUpdateProfile).toHaveBeenCalledWith({ username: 'новый' }),
    )
    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updatedUser))
    await waitFor(() => expect(onClose).toHaveBeenCalled())


import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, jest, beforeEach } from '@jest/globals'

import AccountModal from '../AccountModal.jsx'

const mockUpdate = jest.fn()

jest.mock('../../hooks/useAccount', () => ({
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

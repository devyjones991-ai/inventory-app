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
  })
})

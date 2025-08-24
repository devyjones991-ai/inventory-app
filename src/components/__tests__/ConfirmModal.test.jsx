/* eslint-env jest */

import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, jest } from '@jest/globals'

import ConfirmModal from '../ConfirmModal.jsx'

describe('ConfirmModal', () => {
  test('открывается, обрабатывает кнопки и фокус', async () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()

    render(
      <ConfirmModal
        open
        title="Подтверждение"
        message="Вы уверены?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    )

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()

    const confirmBtn = screen.getByRole('button', { name: 'OK' })
    expect(confirmBtn).toHaveFocus()

    await userEvent.click(confirmBtn)
    expect(onConfirm).toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }))
    expect(onCancel).toHaveBeenCalled()
  })

  test('не отображается, когда закрыт', () => {
    render(
      <ConfirmModal open={false} onConfirm={() => {}} onCancel={() => {}} />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

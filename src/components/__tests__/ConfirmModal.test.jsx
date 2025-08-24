/* eslint-env jest */
import { describe, test, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}))

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, onOpenChange, children }) => (
    <div data-testid="dialog" onClick={() => onOpenChange?.(false)}>
      {open ? children : null}
    </div>
  ),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <div>{children}</div>,
  DialogFooter: ({ children }) => <div>{children}</div>,
}))

import ConfirmModal from '../ConfirmModal'

describe('ConfirmModal', () => {
  test('рендер заголовка и сообщения', () => {
    render(
      <ConfirmModal
        open
        title="Заголовок"
        message="Сообщение"
        onConfirm={() => {}}
        onCancel={() => {}}
      />,
    )
    expect(screen.getByText('Заголовок')).toBeInTheDocument()
    expect(screen.getByText('Сообщение')).toBeInTheDocument()
  })

  test('вызов onConfirm', () => {
    const handleConfirm = jest.fn()
    render(<ConfirmModal open onConfirm={handleConfirm} onCancel={() => {}} />)
    fireEvent.click(screen.getByText('OK'))
    expect(handleConfirm).toHaveBeenCalled()
  })

  test('вызов onCancel', () => {
    const handleCancel = jest.fn()
    render(<ConfirmModal open onConfirm={() => {}} onCancel={handleCancel} />)
    fireEvent.click(screen.getByText('Отмена'))
    expect(handleCancel).toHaveBeenCalled()
  })
})

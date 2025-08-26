import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dialog, DialogContent } from '@/components/ui/dialog.jsx'

describe('Dialog', () => {
  it('открывается и закрывается через проп open', () => {
    const { rerender } = render(
      <Dialog open={true} onOpenChange={() => {}}>
        <DialogContent>Содержимое</DialogContent>
      </Dialog>,
    )

    expect(screen.getByText('Содержимое')).toBeInTheDocument()

    rerender(
      <Dialog open={false} onOpenChange={() => {}}>
        <DialogContent>Содержимое</DialogContent>
      </Dialog>,
    )

    expect(screen.queryByText('Содержимое')).toBeNull()
  })

  it('передает onOpenChange в дочерний компонент', () => {
    const handleOpenChange = jest.fn()

    const Child = ({ onOpenChange }) => (
      <button onClick={() => onOpenChange(false)}>Закрыть</button>
    )

    const { getByText } = render(
      <Dialog open={true} onOpenChange={handleOpenChange}>
        <Child />
      </Dialog>,
    )

    fireEvent.click(getByText('Закрыть'))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })
})

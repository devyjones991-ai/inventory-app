import React from 'react'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '@/components/ErrorBoundary'

function ProblemComponent() {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  it('перехватывает ошибки и отображает резервный UI', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ProblemComponent />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Произошла ошибка.')).toBeInTheDocument()
    expect(spy).toHaveBeenCalled()

    spy.mockRestore()
  })
})

/* eslint-env jest */
import { describe, test, expect, jest } from '@jest/globals'
import { render, screen, fireEvent } from '@testing-library/react'
import ObjectList from '@/components/ObjectList.jsx'

describe('ObjectList', () => {
  test('рендер пустого списка', () => {
    render(<ObjectList objects={[]} onItemClick={() => {}} />)
    expect(screen.getByText('Нет объектов')).toBeInTheDocument()
  })

  test('отображение списка объектов', () => {
    const objects = [
      { id: 1, name: 'Объект 1' },
      { id: 2, name: 'Объект 2' },
    ]
    render(<ObjectList objects={objects} onItemClick={() => {}} />)
    expect(screen.getByText('Объект 1')).toBeInTheDocument()
    expect(screen.getByText('Объект 2')).toBeInTheDocument()
  })

  test('обработка клика по элементу списка', () => {
    const objects = [{ id: 1, name: 'Объект 1' }]
    const handleClick = jest.fn()
    render(<ObjectList objects={objects} onItemClick={handleClick} />)
    fireEvent.click(screen.getByText('Объект 1'))
    expect(handleClick).toHaveBeenCalledWith(objects[0])
  })

  test('фильтрация объектов', () => {
    const objects = [
      { id: 1, name: 'Первый' },
      { id: 2, name: 'Второй' },
    ]
    render(<ObjectList objects={objects} onItemClick={() => {}} />)
    const input = screen.getByPlaceholderText('Поиск')
    fireEvent.change(input, { target: { value: 'Второй' } })
    expect(screen.queryByText('Первый')).not.toBeInTheDocument()
    expect(screen.getByText('Второй')).toBeInTheDocument()
  })

  test('состояние загрузки', () => {
    render(<ObjectList loading onItemClick={() => {}} />)
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  test('обработка ошибок', () => {
    const error = new Error('Ошибка сети')
    render(<ObjectList error={error} onItemClick={() => {}} />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ошибка загрузки данных: Ошибка сети',
    )
  })
})

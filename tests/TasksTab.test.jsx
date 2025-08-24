import '@testing-library/jest-dom'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TasksTab from '../src/components/TasksTab.jsx'

jest.mock('../src/hooks/useTasks.js', () => ({
  useTasks: () => ({
    tasks: [],
    loading: false,
    error: null,
    loadTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    importTasks: jest.fn(),
  }),
}))

describe('TasksTab', () => {
  const selected = { id: '1' }

  it('регистрирует обработчик добавления и не содержит локальной кнопки', () => {
    const registerAddHandler = jest.fn()
    render(
      <MemoryRouter>
        <TasksTab selected={selected} registerAddHandler={registerAddHandler} />
      </MemoryRouter>,
    )
    expect(registerAddHandler).toHaveBeenCalled()
    expect(screen.queryByText('+ Добавить')).not.toBeInTheDocument()
    const handler = registerAddHandler.mock.calls[0][0]
    act(() => handler())
    expect(screen.getByText('Добавить задачу')).toBeInTheDocument()
  })
})

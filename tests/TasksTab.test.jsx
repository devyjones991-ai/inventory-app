var mockTasks = [],
  mockLoadTasks,
  mockCreateTask,
  mockUpdateTask
const mockNavigate = jest.fn()

jest.mock('../src/hooks/useTasks.js', () => ({
  useTasks: () => ({
    get tasks() {
      return mockTasks
    },
    loading: false,
    error: null,
    loadTasks: mockLoadTasks,
    createTask: mockCreateTask,
    updateTask: mockUpdateTask,
    deleteTask: jest.fn(),
    importTasks: jest.fn(),
  }),
}))

jest.mock('../src/hooks/useAuth.js', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'me@example.com' } }),
}))

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TasksTab from '../src/components/TasksTab.jsx'

describe.skip('TasksTab', () => {
  const selected = { id: '1' }

  beforeEach(() => {
    mockTasks = []
    mockLoadTasks = jest.fn()
    mockCreateTask = jest.fn().mockResolvedValue({ data: null, error: null })
    mockUpdateTask = jest.fn().mockResolvedValue({ data: null, error: null })
    jest.clearAllMocks()
  })

  it('показывает сообщение при отсутствии задач', async () => {
    render(
      <MemoryRouter>
        <TasksTab selected={selected} />
      </MemoryRouter>,
    )
    expect(
      await screen.findByText('Задач пока нет. Добавьте первую задачу!'),
    ).toBeInTheDocument()
  })

  it('добавляет задачу с due_date', async () => {
    render(
      <MemoryRouter>
        <TasksTab selected={selected} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('+ Добавить'))
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'Новая задача' },
    })
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2024-05-10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Добавить' }))

    await waitFor(() => expect(mockCreateTask).toHaveBeenCalled())

    const payload = mockCreateTask.mock.calls[0][0]
    expect(payload).toEqual({
      title: 'Новая задача',
      assignee: '',
      due_date: '2024-05-10',
      status: 'pending',
      notes: '',
    })
    expect(payload).not.toHaveProperty('assignee_id')
  })

  it('редактирует задачу с due_date', async () => {
    mockTasks = [
      {
        id: 't1',
        title: 'Старая задача',
        status: 'pending',
        assignee: '',
        due_date: '2024-05-10',
        notes: '',
      },
    ]

    render(
      <MemoryRouter>
        <TasksTab selected={selected} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByTitle('Редактировать'))
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2024-05-15' } })
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalled())

    const payload = mockUpdateTask.mock.calls[0][1]
    expect(payload).toEqual({
      title: 'Старая задача',
      assignee: '',
      due_date: '2024-05-15',
      status: 'pending',
      notes: '',
    })
    expect(payload).not.toHaveProperty('assignee_id')
  })
})

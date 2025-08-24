import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TasksTab from '../src/components/TasksTab.jsx'

var mockCreateTask, mockUpdateTask, mockLoadTasks, mockTasks
const mockNavigate = jest.fn()

jest.mock('../src/hooks/useTasks.js', () => {
  mockTasks = []
  mockLoadTasks = jest.fn()
  mockCreateTask = jest.fn()
  mockUpdateTask = jest.fn()
  return {
    useTasks: () => ({
      tasks: mockTasks,
      loading: false,
      error: null,
      loadTasks: mockLoadTasks,
      createTask: mockCreateTask,
      updateTask: mockUpdateTask,
      deleteTask: jest.fn(),
      importTasks: jest.fn(),
    }),
  }
})

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

describe('TasksTab', () => {
  const selected = { id: '1' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockTasks = []
    mockLoadTasks.mockResolvedValue({ data: [], error: null })
    mockCreateTask.mockResolvedValue({ data: null, error: null })
    mockUpdateTask.mockResolvedValue({ data: null, error: null })
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
    mockCreateTask.mockResolvedValue({
      data: {
        id: 't1',
        title: 'Новая задача',
        status: 'запланировано',
        assignee: null,
        due_date: '2024-05-10',
        notes: null,
      },
      error: null,
    })

    render(
      <MemoryRouter>
        <TasksTab selected={selected} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Добавить задачу'))
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'Новая задача' },
    })
    fireEvent.click(screen.getByText('📅'))
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2024-05-10' } })
    fireEvent.click(screen.getByText('Сохранить'))
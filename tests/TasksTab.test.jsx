import '@testing-library/jest-dom'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TasksTab from '../src/components/TasksTab.jsx'

var mockTasks = [],
  mockLoadTasks,
  mockCreateTask,
  mockUpdateTask
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
  const selected = { id: 1 }

  beforeEach(() => {
    mockTasks = []
    mockLoadTasks.mockResolvedValue({ data: [], error: null })
    mockCreateTask.mockResolvedValue({ data: null, error: null })
    mockUpdateTask.mockResolvedValue({ data: null, error: null })
    jest.clearAllMocks()
  })

  it('показывает сообщение при отсутствии задач', async () => {
    render(
      <MemoryRouter>
        <TasksTab selected={selected} />
      </MemoryRouter>,
    )
    expect(
      await screen.findByText('Нет задач для этого объекта.'),
    ).toBeInTheDocument()
  })

  it('добавляет задачу с assignee', async () => {
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

    const titleInput = screen.getByLabelText('Название')
    const assigneeInput = screen.getByLabelText('Исполнитель')
    const dueDateInput = screen.getByLabelText('Дата выполнения')

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Новая задача' } })
      fireEvent.change(assigneeInput, { target: { value: 'Иван Петров' } })
      fireEvent.change(dueDateInput, { target: { value: '2024-12-31' } })
    })

    fireEvent.click(screen.getByText('📅'))
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2024-05-10' } })
    fireEvent.click(screen.getByText('Сохранить'))

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: 'Новая задача',
        assignee: 'Иван Петров',
        due_date: '2024-05-10',
        status: 'запланировано',
        notes: '',
        object_id: 1,
      })
    })
  })

  it('обновляет задачу', async () => {
    const task = {
      id: 't1',
      title: 'Существующая задача',
      status: 'в работе',
      assignee: 'Старый исполнитель',
      due_date: '2024-01-01',
      notes: 'Старые заметки',
    }

    mockTasks = [task]
    mockUpdateTask.mockResolvedValue({ data: task, error: null })

    render(
      <MemoryRouter>
        <TasksTab selected={selected} />
      </MemoryRouter>,
    )

    const editButton = await screen.findByLabelText('Редактировать задачу')
    fireEvent.click(editButton)

    const titleInput = screen.getByDisplayValue('Существующая задача')
    const assigneeInput = screen.getByDisplayValue('Старый исполнитель')

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Обновленная задача' } })
      fireEvent.change(assigneeInput, { target: { value: 'Новый исполнитель' } })
    })

    fireEvent.click(screen.getByText('Сохранить'))

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith('t1', {
        title: 'Обновленная задача',
        status: 'в работе',
        assignee: 'Новый исполнитель',
        due_date: '2024-01-01',
        notes: 'Старые заметки',
        object_id: 1,
      })
    })
  })
})

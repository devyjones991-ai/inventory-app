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
  const selected = { id: '1' }

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
        assignee: 'Иван Петров',
        due_date: '2024-12-31',
        status: 'pending',
        notes: '',
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

    await act(async () => {
      fireEvent.click(screen.getByText('Добавить'))
    })

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: 'Новая задача',
        assignee: 'Иван Петров',
        due_date: '2024-12-31',
        status: 'pending',
        notes: '',
      })
    })
  })

  it('обновляет задачу с новым assignee', async () => {
    const existingTask = {
      id: 't1',
      title: 'Существующая задача',
      assignee: 'Старый исполнитель',
      due_date: '2024-12-25',
      status: 'pending',
      notes: 'Старые заметки',
    }

    mockTasks = [existingTask]
    mockUpdateTask.mockResolvedValue({
      data: {
        ...existingTask,
        assignee: 'Новый исполнитель',
        notes: 'Обновленные заметки',
      },
      error: null,
    })

    const TaskCard = ({ task, onEdit }) => (
      <div>
        <span>{task.title}</span>
        <button onClick={() => onEdit(task)}>Редактировать</button>
      </div>
    )

    jest.doMock('../src/components/TaskCard.jsx', () => TaskCard)

    render(
      <MemoryRouter>
        <TasksTab selected={selected} />
      </MemoryRouter>,
    )

    const editButton = await screen.findByText('Редактировать')
    fireEvent.click(editButton)

    const assigneeInput = screen.getByDisplayValue('Старый исполнитель')
    const notesInput = screen.getByDisplayValue('Старые заметки')

    await act(async () => {
      fireEvent.change(assigneeInput, { target: { value: 'Новый исполнитель' } })
      fireEvent.change(notesInput, { target: { value: 'Обновленные заметки' } })
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Сохранить'))
    })

    await waitFor(() => {
      expect(mockUpdateTask).toHaveBeenCalledWith('t1', {
        title: 'Существующая задача',
        assignee: 'Новый исполнитель',
        due_date: '2024-12-25',
        status: 'pending',
        notes: 'Обновленные заметки',
      })
    })
  })

  it('правильно обрабатывает форму с пустым assignee', async () => {
    render(
      <MemoryRouter>
        <TasksTab selected={selected} />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText('Добавить задачу'))

    const titleInput = screen.getByLabelText('Название')
    const assigneeInput = screen.getByLabelText('Исполнитель')

    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Задача без исполнителя' } })
      // assignee остается пустым
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Добавить'))
    })

    await waitFor(() => {
      expect(mockCreateTask).toHaveBeenCalledWith({
        title: 'Задача без исполнителя',
        assignee: '',
        due_date: '',
        status: 'pending',
        notes: '',
      })
    })
  })
})
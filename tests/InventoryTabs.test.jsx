var mockInsertHardware
var mockDeleteHardware
var mockFetchHardwareApi
var mockFetchTasksApi
var mockInsertTask
var mockUpdateTask
var mockFetchMessages
var mockSubscribeToTasks
var taskHandler
const mockNavigate = jest.fn()

jest.mock('../src/supabaseClient.js', () => {
  const from = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockResolvedValue({ data: [], error: null }),
  }))
  return { supabase: { from } }
})

jest.mock('../src/hooks/useHardware.js', () => {
  mockInsertHardware = jest.fn()
  mockDeleteHardware = jest.fn()
  mockFetchHardwareApi = jest.fn().mockResolvedValue({ data: [], error: null })
  return {
    useHardware: () => ({
      fetchHardware: mockFetchHardwareApi,
      insertHardware: mockInsertHardware,
      updateHardware: jest.fn(),
      deleteHardware: mockDeleteHardware,
    }),
  }
})

jest.mock('../src/hooks/useTasks.js', () => {
  mockFetchTasksApi = jest.fn().mockResolvedValue({ data: [], error: null })
  mockInsertTask = jest.fn()
  mockUpdateTask = jest.fn()
  mockSubscribeToTasks = jest.fn((_, handler) => {
    taskHandler = handler
    return jest.fn()
  })
  return {
    useTasks: () => ({
      fetchTasks: mockFetchTasksApi,
      insertTask: mockInsertTask,
      updateTask: mockUpdateTask,
      deleteTask: jest.fn(),
      subscribeToTasks: mockSubscribeToTasks,
    }),
  }
})

jest.mock('../src/hooks/useChatMessages.js', () => {
  mockFetchMessages = jest.fn().mockResolvedValue({ data: [], error: null })
  return {
    useChatMessages: () => ({
      fetchMessages: mockFetchMessages,
      subscribeToMessages: jest.fn(() => jest.fn()),
    }),
  }
})

jest.mock('../src/hooks/useObjects.js', () => ({
  useObjects: () => ({ updateObject: jest.fn() }),
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

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import InventoryTabs from '../src/components/InventoryTabs.jsx'
import { toast } from 'react-hot-toast'

describe('InventoryTabs', () => {
  const selected = { id: '1', name: 'Объект 1' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchHardwareApi.mockResolvedValue({ data: [], error: null })
    mockFetchTasksApi.mockResolvedValue({ data: [], error: null })
    mockInsertTask.mockResolvedValue({ data: null, error: null })
    mockUpdateTask.mockResolvedValue({ data: null, error: null })
    taskHandler = null
  })

  it('переключает вкладки "Железо" и "Задачи"', async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText(/Железо/))
    expect(await screen.findByText('Оборудование')).toBeInTheDocument()

    fireEvent.click(screen.getAllByText(/Задачи/)[0])
    expect(await screen.findByText('Задачи')).toBeInTheDocument()
  })

  it('показывает сообщение при отсутствии задач', async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText(/Задачи/)[0])

    expect(await screen.findByText('Задачи не найдены')).toBeInTheDocument()
  })

  it('подгружает дополнительные задачи по кнопке «Загрузить ещё»', async () => {
    const tasks1 = Array.from({ length: 20 }, (_, i) => ({
      id: `t${i}`,
      title: `Task ${i}`,
      status: 'запланировано',
    }))
    const tasks2 = Array.from({ length: 5 }, (_, i) => ({
      id: `t${i + 20}`,
      title: `Task ${i + 20}`,
      status: 'запланировано',
    }))
    mockFetchTasksApi
      .mockResolvedValueOnce({ data: tasks1, error: null })
      .mockResolvedValueOnce({ data: tasks2, error: null })

    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText(/Задачи/)[0])

    const loadMoreBtn = await screen.findByText('Загрузить ещё')
    fireEvent.click(loadMoreBtn)

    await waitFor(() =>
      expect(mockFetchTasksApi).toHaveBeenLastCalledWith(selected.id, 20, 20),
    )
    const list = screen.getByTestId('task-list')
    expect(list.firstChild.style.height).toBe('3000px')
    expect(screen.queryByText('Загрузить ещё')).not.toBeInTheDocument()
  })

  it('создаёт и удаляет запись оборудования', async () => {
    mockInsertHardware.mockResolvedValue({
      data: {
        id: 'h1',
        name: 'Маршрутизатор',
        location: '',
        purchase_status: 'не оплачен',
        install_status: 'не установлен',
      },
      error: null,
    })
    mockDeleteHardware.mockResolvedValue({ error: null })

    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText(/Железо/))
    fireEvent.click(await screen.findByText('Добавить'))

    const nameInput = screen.getByPlaceholderText('Например, keenetic giga')
    fireEvent.change(nameInput, { target: { value: 'Маршрутизатор' } })

    fireEvent.click(screen.getByText('Сохранить'))

    await waitFor(() => expect(mockInsertHardware).toHaveBeenCalled())
    expect(await screen.findByText('Маршрутизатор')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Удалить'))
    await waitFor(() => screen.getByText('Удалить оборудование?'))
    fireEvent.click(screen.getByText('OK'))

    await waitFor(() => expect(mockDeleteHardware).toHaveBeenCalledWith('h1'))
    expect(screen.queryByText('Маршрутизатор')).not.toBeInTheDocument()
  })

  it('обрабатывает ошибку при добавлении оборудования', async () => {
    mockInsertHardware.mockResolvedValue({
      data: null,
      error: { status: 400, message: 'fail' },
    })

    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByText(/Железо/))
    fireEvent.click(await screen.findByText('Добавить'))

    const nameInput = screen.getByPlaceholderText('Например, keenetic giga')
    fireEvent.change(nameInput, { target: { value: 'Ошибка' } })
    fireEvent.click(screen.getByText('Сохранить'))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Ошибка оборудования: fail'),
    )
  })

  it('добавляет задачу с due_date', async () => {
    mockInsertTask.mockResolvedValue({
      data: {
        id: 't1',
        title: 'Новая задача',
        status: 'запланировано',
        assignee: null,
        assignee_id: null,
        due_date: '2024-05-10',
        notes: null,
      },
      error: null,
    })

    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText(/Задачи/)[0])
    fireEvent.click(await screen.findByText('Добавить задачу'))

    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: 'Новая задача' },
    })
    fireEvent.click(screen.getByText('📅'))
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2024-05-10' } })
    fireEvent.click(screen.getByText('Сохранить'))

    await waitFor(() => expect(mockInsertTask).toHaveBeenCalled())

    const payload = mockInsertTask.mock.calls[0][0]
    expect(payload).toEqual({
      object_id: selected.id,
      title: 'Новая задача',
      status: 'запланировано',
      assignee: null,
      assignee_id: null,
      due_date: '2024-05-10',
      notes: null,
    })

    expect(await screen.findByText('Новая задача')).toBeInTheDocument()
  })

  it('редактирует задачу с due_date', async () => {
    mockFetchTasksApi.mockResolvedValue({
      data: [
        {
          id: 't1',
          title: 'Старая задача',
          status: 'запланировано',
          assignee: null,
          assignee_id: null,
          due_date: '2024-05-10',
          notes: null,
        },
      ],
      error: null,
    })
    mockUpdateTask.mockResolvedValue({
      data: {
        id: 't1',
        title: 'Старая задача',
        status: 'запланировано',
        assignee: null,
        assignee_id: null,
        due_date: '2024-05-15',
        notes: null,
      },
      error: null,
    })

    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText(/Задачи/)[0])
    expect(await screen.findByText('Старая задача')).toBeInTheDocument()

    fireEvent.click(screen.getByTitle('Редактировать'))
    fireEvent.click(screen.getByText('📅'))
    const dateInput = document.querySelector('input[type="date"]')
    fireEvent.change(dateInput, { target: { value: '2024-05-15' } })
    fireEvent.click(screen.getByText('Сохранить'))

    await waitFor(() => expect(mockUpdateTask).toHaveBeenCalled())

    const payload = mockUpdateTask.mock.calls[0][1]
    expect(payload.due_date).toBe('2024-05-15')
    expect(payload).not.toHaveProperty('planned_date')
    expect(payload).not.toHaveProperty('plan_date')
  })

  it('просматривает задачу с due_date', async () => {
    mockFetchTasksApi.mockResolvedValue({
      data: [
        {
          id: 't1',
          title: 'Просмотр',
          status: 'запланировано',
          due_date: '2024-05-10',
        },
      ],
      error: null,
    })

    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText(/Задачи/)[0])
    fireEvent.click(await screen.findByText('Просмотр'))

    expect(await screen.findByText('10.05.2024')).toBeInTheDocument()
  })

  it('синхронизирует список задач при обновлении и удалении', async () => {
    mockFetchTasksApi.mockResolvedValue({
      data: [{ id: 't1', title: 'Задача 1', status: 'запланировано' }],
      error: null,
    })

    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getAllByText(/Задачи/)[0])
    expect(await screen.findByText('Задача 1')).toBeInTheDocument()

    act(() => {
      taskHandler({
        eventType: 'UPDATE',
        new: { id: 't1', title: 'Обновлено', status: 'в процессе' },
      })
    })

    expect(await screen.findByText('Обновлено')).toBeInTheDocument()

    act(() => {
      taskHandler({ eventType: 'DELETE', old: { id: 't1' } })
    })

    await waitFor(() =>
      expect(screen.queryByText('Обновлено')).not.toBeInTheDocument(),
    )
  })
})

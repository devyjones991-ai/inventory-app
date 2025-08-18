var mockInsertHardware
var mockDeleteHardware
var mockFetchHardwareApi
var mockFetchTasksApi
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
  mockSubscribeToTasks = jest.fn((_, handler) => {
    taskHandler = handler
    return jest.fn()
  })
  return {
    useTasks: () => ({
      fetchTasks: mockFetchTasksApi,
      insertTask: jest.fn(),
      updateTask: jest.fn(),
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
    expect(await screen.findByText('Task 24')).toBeInTheDocument()
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

    fireEvent.click(screen.getByText(/Задачи/))
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

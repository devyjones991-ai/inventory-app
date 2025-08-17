var mockInsertHardware
var mockDeleteHardware
var mockFetchHardwareApi
var mockFetchTasksApi
var mockFetchMessages
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
  return {
    useTasks: () => ({
      fetchTasks: mockFetchTasksApi,
      insertTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      subscribeToTasks: jest.fn(() => jest.fn()),
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

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import InventoryTabs from '../src/components/InventoryTabs.jsx'
import { toast } from 'react-hot-toast'

describe('InventoryTabs', () => {
  const selected = { id: '1', name: 'Объект 1' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchHardwareApi.mockResolvedValue({ data: [], error: null })
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

    fireEvent.click(screen.getByText(/Задачи/))
    expect(await screen.findByText('Задачи')).toBeInTheDocument()
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
})

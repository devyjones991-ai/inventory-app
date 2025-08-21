// Tests for InventoryTabs component
import '@testing-library/jest-dom'

let mockLoadHardware, mockFetchHardwareApi, mockFetchMessages, mockNavigate

jest.mock('../src/hooks/useHardware.js', () => {
  mockLoadHardware = jest.fn().mockResolvedValue({ data: [], error: null })
  mockFetchHardwareApi = jest.fn().mockResolvedValue({ data: [], error: null })
  
  return {
    useHardware: () => ({
      hardware: [],
      loading: false,
      error: null,
      loadHardware: mockLoadHardware,
      fetchHardwareApi: mockFetchHardwareApi,
      createHardware: jest.fn(),
      updateHardware: jest.fn(),
      deleteHardware: jest.fn(),
    }),
  }
})

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

    fireEvent.click(screen.getAllByText(/Задачи/)[0])
    expect(
      await screen.findByRole('heading', { name: 'Задачи' }),
    ).toBeInTheDocument()
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
    expect(
      await screen.findByText('Задач пока нет. Добавьте первую задачу!'),
    ).toBeInTheDocument()
  })
})

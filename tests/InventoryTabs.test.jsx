// Tests for InventoryTabs component
import '@testing-library/jest-dom'

/* eslint-env jest */

var mockLoadHardware,
  mockFetchMessages,
  mockNavigate,
  mockHardware,
  mockCreateHardware,
  mockUpdateHardware

jest.mock('../src/hooks/usePersistedForm.js', () => () => ({
  register: jest.fn(),
  handleSubmit: (fn) => fn,
  reset: jest.fn(),
  watch: jest.fn((field) =>
    field === 'purchase_status' ? 'не оплачен' : 'не установлен',
  ),
  formState: { errors: {} },
}))

jest.mock('../src/hooks/useHardware.js', () => {
  mockLoadHardware = jest.fn().mockResolvedValue({ data: [], error: null })
  mockCreateHardware = jest.fn()
  mockUpdateHardware = jest.fn()
  mockHardware = []

  return {
    useHardware: () => ({
      hardware: mockHardware,
      loading: false,
      error: null,
      loadHardware: mockLoadHardware,
      createHardware: mockCreateHardware,
      updateHardware: mockUpdateHardware,
      deleteHardware: jest.fn(),
    }),
  }
})

jest.mock('../src/hooks/useTasks.js', () => {
  const tasks = []
  const mocked = {
    tasks,
    loading: false,
    error: null,
    loadTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    importTasks: jest.fn(),
  }
  return { useTasks: () => mocked }
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

import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import InventoryTabs from '../src/components/InventoryTabs.jsx'

describe('InventoryTabs', () => {
  const selected = { id: 1, name: 'Объект 1' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHardware = []
  })

  it('переключает вкладки "Железо" и "Задачи"', async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
          setAddAction={jest.fn()}
          openAddObject={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Железо' }))
    expect(await screen.findByText('Оборудование')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Задачи' }))
    expect(
      await screen.findByRole('heading', { name: /Задачи/ }),
    ).toBeInTheDocument()
  })

  it('показывает сообщение при отсутствии задач', async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
          setAddAction={jest.fn()}
          openAddObject={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Задачи' }))
    expect(
      await screen.findByText('Нет задач для этого объекта.'),
    ).toBeInTheDocument()
  })

  it('отображает чат', async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
          setAddAction={jest.fn()}
          openAddObject={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Чат' }))
    expect(
      screen.getByPlaceholderText(
        'Напиши сообщение… (Enter — отправить, Shift+Enter — новая строка)',
      ),
    ).toBeInTheDocument()
  })

  it('открывает форму добавления оборудования', async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
          setAddAction={jest.fn()}
          openAddObject={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Железо' }))
    fireEvent.click(screen.getByRole('button', { name: /Добавить/ }))
    expect(screen.getByPlaceholderText('Название')).toHaveClass('w-full')
    expect(screen.getByPlaceholderText('Расположение')).toHaveClass('w-full')
  })

  it('открывает форму редактирования оборудования', async () => {
    mockHardware = [
      {
        id: 1,
        name: 'Принтер',
        location: 'Офис',
        purchase_status: 'не оплачен',
        install_status: 'не установлен',
      },
    ]

    render(
      <MemoryRouter>
        <InventoryTabs
          selected={selected}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
          setAddAction={jest.fn()}
          openAddObject={jest.fn()}
        />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Железо' }))
    const editBtn = await screen.findByRole('button', { name: 'Изменить' })
    fireEvent.click(editBtn)
    expect(screen.getByPlaceholderText('Название')).toBeInTheDocument()
  })
})

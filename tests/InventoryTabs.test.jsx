// Tests for InventoryTabs component
import '@testing-library/jest-dom'

/* eslint-env jest */

var mockLoadHardware,
  mockFetchMessages,
  mockNavigate,
  mockHardware,
  mockCreateHardware,
  mockUpdateHardware

jest.mock('@/hooks/usePersistedForm.js', () => () => ({
  register: jest.fn(),
  handleSubmit: (fn) => fn,
  reset: jest.fn(),
  watch: jest.fn((field) =>
    field === 'purchase_status' ? 'не оплачен' : 'не установлен',
  ),
  formState: { errors: {} },
}))

jest.mock('@/hooks/useHardware.js', () => {
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

jest.mock('@/hooks/useTasks.js', () => {
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

jest.mock('@/hooks/useChatMessages.js', () => {
  mockFetchMessages = jest.fn().mockResolvedValue({ data: [], error: null })
  return {
    useChatMessages: () => ({
      fetchMessages: mockFetchMessages,
      subscribeToMessages: jest.fn(() => jest.fn()),
    }),
  }
})

jest.mock('@/hooks/useObjects.js', () => ({
  useObjects: () => ({ updateObject: jest.fn() }),
}))

jest.mock('@/hooks/useAuth.js', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'me@example.com' } }),
}))

jest.mock('react-hot-toast', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

import { render, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import InventoryTabs from '@/components/InventoryTabs.jsx'

describe('InventoryTabs', () => {
  const selected = { id: 1, name: 'Объект 1' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHardware = []
  })

  it('отображает все вкладки', () => {
    const { container } = render(
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

    const tabTexts = within(container)
      .getAllByRole('tab')
      .map((el) => el.textContent)
    expect(tabTexts).toEqual(
      expect.arrayContaining(['Железо', 'Задачи', 'Чат']),
    )
  })
})

// Tests for InventoryTabs component
import '@testing-library/jest-dom'

/* eslint-env jest */

var mockLoadHardware,
  mockFetchMessages,
  mockNavigate,
  mockHardware,
  mockCreateHardware,
  mockUpdateHardware,
  mockReset

jest.mock('@/hooks/usePersistedForm.js', () => () => {
  mockReset = jest.fn()
  return {
    register: jest.fn(),
    handleSubmit: (fn) => fn,
    reset: mockReset,
    setValue: jest.fn(),
    watch: jest.fn((field) =>
      field === 'purchase_status' ? 'не оплачен' : 'не установлен',
    ),
    formState: { errors: {} },
  }
})

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
      sendMessage: jest.fn(),
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

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import InventoryTabs from '@/components/InventoryTabs.jsx'

describe('InventoryTabs', () => {
  const selected = { id: '1', name: 'Объект 1' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockHardware = []
  })

  it('отображает все вкладки', async () => {
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
      expect.arrayContaining([
        expect.stringMatching(/Железо/),
        expect.stringMatching(/Задачи/),
        expect.stringMatching(/Чат/),
      ]),
    )
    await userEvent.click(screen.getByRole('tab', { name: /Железо/ }))
    expect(await screen.findByText('Оборудование')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: /Задачи/ }))
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

    await userEvent.click(screen.getByRole('tab', { name: /Задачи/ }))
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

    await userEvent.click(screen.getByRole('tab', { name: /Чат/ }))
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

    await userEvent.click(screen.getByRole('tab', { name: /Железо/ }))
    await userEvent.click(screen.getByRole('button', { name: /Добавить/ }))
    expect(screen.getByPlaceholderText('Название')).toHaveClass('w-full')
    expect(screen.getByPlaceholderText('Расположение')).toHaveClass('w-full')
  })

  it('открывает форму редактирования оборудования', async () => {
    mockHardware = [
      {
        id: '1',
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

    await userEvent.click(screen.getByRole('tab', { name: /Железо/ }))
    const editBtn = await screen.findByRole('button', { name: 'Изменить' })
    await userEvent.click(editBtn)
    await screen.findByPlaceholderText('Название')
    expect(mockReset).toHaveBeenLastCalledWith(mockHardware[0])
  })

  it('скрывает кнопки сохранения описания после сохранения', async () => {
    render(
      <MemoryRouter>
        <InventoryTabs
          selected={{ id: '1', name: 'Объект', description: 'старое' }}
          onUpdateSelected={jest.fn()}
          onTabChange={jest.fn()}
          setAddAction={jest.fn()}
          openAddObject={jest.fn()}
        />
      </MemoryRouter>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Изменить' }))
    const textarea = screen.getByRole('textbox')
    await userEvent.clear(textarea)
    await userEvent.type(textarea, 'новое описание')
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }))

    expect(
      await screen.findByRole('button', { name: 'Изменить' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Сохранить' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Отмена' }),
    ).not.toBeInTheDocument()
  })
})

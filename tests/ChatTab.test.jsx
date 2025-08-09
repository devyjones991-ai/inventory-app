// codex/ensure-single-test-filename-format
import React from 'react'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ChatTab from '../src/components/ChatTab.jsx'

const { supabaseMock, insertMock, initialMessages } = vi.hoisted(() => {
  const initialMessages = [
    {
      id: '1',
      object_id: '1',
      sender: 'Alice',
      content: 'Привет',
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      object_id: '1',
      sender: 'Bob',
      content: 'Здравствуйте',
      created_at: new Date().toISOString(),
    },
  ]

  const selectMock = vi.fn(() => ({
    eq: vi.fn(() => ({
      order: vi.fn(() =>
        Promise.resolve({ data: initialMessages, error: null }),
      ),
    })),
  }))

  const insertMock = vi.fn(() =>
    Promise.resolve({ data: { id: '3' }, error: null }),
  )

  const fromMock = vi.fn(() => ({ select: selectMock, insert: insertMock }))

  const channelMock = vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  }))

  const removeChannelMock = vi.fn()

  const supabaseMock = {
    from: fromMock,
    channel: channelMock,
    removeChannel: removeChannelMock,
  }

  return { supabaseMock, insertMock, initialMessages }
})

vi.mock('../src/supabaseClient.js', () => ({ supabase: supabaseMock }))

describe('ChatTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // jsdom doesn't implement scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('отображает сообщения и отправляет новое', async () => {
    render(<ChatTab selected={{ id: '1' }} user={{ email: 'me' }} />)

    for (const msg of initialMessages) {
      expect(await screen.findByText(msg.content)).toBeInTheDocument()
    }

    const textarea = screen.getByPlaceholderText(
      'Напиши сообщение… (Enter — отправить, Shift+Enter — новая строка)',
    )
    fireEvent.change(textarea, { target: { value: 'Новое сообщение' } })

    fireEvent.click(screen.getByText('Отправить'))

    await waitFor(() => expect(insertMock).toHaveBeenCalled())
    expect(textarea.value).toBe('')
  })
})

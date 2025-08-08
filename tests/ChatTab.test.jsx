import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

const initialMessages = [
  { id: '1', sender: 'Alice', content: 'Привет' },
  { id: '2', sender: 'Bob', content: 'Здравствуйте' },
]

const fetchMessagesMock = vi.fn(() =>
  Promise.resolve({ data: initialMessages, error: null }),
)
let subscribeHandler
const subscribeToMessagesMock = vi.fn((_objectId, handler) => {
  subscribeHandler = handler
  return () => {}
})
const sendMessageMock = vi.fn(async ({ objectId, sender, content }) => {
  const newMessage = {
    id: String(Date.now()),
    object_id: objectId,
    sender,
    content,
  }
  if (subscribeHandler) {
    subscribeHandler({ new: newMessage })
  }
  return { data: newMessage, error: null }
})

vi.mock('@/hooks/useChatMessages.js', () => ({
  useChatMessages: () => ({
    fetchMessages: fetchMessagesMock,
    sendMessage: sendMessageMock,
    subscribeToMessages: subscribeToMessagesMock,
  }),
}))

import ChatTab from '@/components/ChatTab.jsx'

describe('ChatTab', () => {
  it('отображает сообщения и форму отправки', async () => {
    render(<ChatTab objectId="1" sender="me" />)
    for (const msg of initialMessages) {
      expect(await screen.findByText(msg.content)).toBeInTheDocument()
    }
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('отправляет новое сообщение', async () => {
    render(<ChatTab objectId="1" sender="me" />)
    const input = await screen.findByRole('textbox')
    const button = screen.getByRole('button')
    fireEvent.change(input, { target: { value: 'Новое сообщение' } })
    fireEvent.click(button)
    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalled()
      expect(screen.getByText('Новое сообщение')).toBeInTheDocument()
    })
  })
})

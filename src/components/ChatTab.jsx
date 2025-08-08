import React, { useEffect, useRef, useState } from 'react'
import ChatCard from './ChatCard'
import { useChatMessages } from '../hooks/useChatMessages'
import { toast } from 'react-hot-toast'

export default function ChatTab({ selected, user }) {
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [file, setFile] = useState(null)
  const messagesEndRef = useRef(null)
  const { fetchMessages, sendMessage, subscribeToMessages } = useChatMessages()

  useEffect(() => {
    if (!selected?.id) return
    fetchMessages(selected.id).then(({ data, error }) => {
      if (error) toast.error('Ошибка загрузки сообщений: ' + error.message)
      else setMessages(data || [])
    })
    const unsubscribe = subscribeToMessages(selected.id, (payload) => {
      setMessages((prev) => [...prev, payload.new])
    })
    return () => {
      unsubscribe()
    }
  }, [selected, fetchMessages, subscribeToMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content && !file) return
    const { error } = await sendMessage({
      objectId: selected.id,
      sender: user?.email,
      content,
      file,
    })
    if (error) toast.error('Ошибка отправки: ' + error.message)
    else {
      setContent('')
      setFile(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">
        {messages.map((m) => (
          <ChatCard key={m.id} message={m} />
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          className="textarea textarea-bordered w-full"
          placeholder="Сообщение"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="file-input file-input-bordered w-full"
        />
        <button type="submit" className="btn btn-primary self-end">
          Отправить
        </button>
      </form>
    </div>
  )
}

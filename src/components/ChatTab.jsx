codex/refactor-chattab-to-use-chatcard
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
    if (!selected) return
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
  }, [selected])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content && !file) return
    const { data, error } = await sendMessage({
      objectId: selected.id,
      sender: user?.email,
      content,
      file,
    })
    if (error) toast.error('Ошибка отправки: ' + error.message)
    else {
      setMessages((prev) => [...prev, data])
      setContent('')
      setFile(null)

import { useEffect, useRef, useState } from 'react'
import { useChatMessages } from '../hooks/useChatMessages'

export default function ChatTab({ selected, user }) {
  const { fetchMessages, sendMessage, subscribeToMessages } = useChatMessages()
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const fileRef = useRef()

  useEffect(() => {
    if (!selected?.id) return

    let isMounted = true

    ;(async () => {
      const { data } = await fetchMessages(selected.id)
      if (isMounted && data) setMessages(data)
    })()

    const unsubscribe = subscribeToMessages(selected.id, (payload) => {
      const newMessage = payload.new
      setMessages((prev) => [...prev, newMessage])
    })

    return () => {
      isMounted = false
      unsubscribe && unsubscribe()
    }
  }, [selected, fetchMessages, subscribeToMessages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !fileRef.current?.files[0]) return

    const sender = user?.email || user?.user_metadata?.username
    const file = fileRef.current?.files[0]
    const { data, error } = await sendMessage({
      objectId: selected.id,
      sender,
      content,
      file,
    })
    if (!error && data) {
      setMessages((prev) => [...prev, data])
      setContent('')
      if (fileRef.current) fileRef.current.value = ''
 main
    }
  }

  return (
    <div className="flex flex-col h-full">
 codex/refactor-chattab-to-use-chatcard
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

      <div className="flex-1 overflow-y-auto space-y-2 p-4">
        {messages.map((msg) => (
          <div key={msg.id} className="p-2 bg-base-200 rounded">
            <div className="text-sm text-gray-500">{msg.sender}</div>
            <div>{msg.content}</div>
            {msg.file_url && (
              <a
                href={msg.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                Attachment
              </a>
            )}
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          type="text"
          className="input input-bordered flex-1"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message"
        />
        <input
          type="file"
          ref={fileRef}
          className="file-input file-input-bordered"
        />
        <button type="submit" className="btn btn-primary">
          Send
 main
        </button>
      </form>
    </div>
  )
}

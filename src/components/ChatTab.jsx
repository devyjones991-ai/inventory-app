import React, { useEffect, useRef, useState } from 'react'
import ChatCard from './ChatCard'
import { useChatMessages } from '../hooks/useChatMessages'
import { toast } from 'react-hot-toast'

export default function ChatTab({ selected, user, objectId, sender }) {
  const { fetchMessages, sendMessage, subscribeToMessages } = useChatMessages()
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const fileRef = useRef(null)
  const messagesEndRef = useRef(null)

codex/update-chattab-test-cases
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

  const objectIdToUse = selected?.id ?? objectId
  const currentSender = user?.email || user?.user_metadata?.username || sender

  useEffect(() => {
    if (!objectIdToUse) return

    let isMounted = true

    ;(async () => {
      const { data, error } = await fetchMessages(objectIdToUse)
      if (error) toast.error('Ошибка загрузки сообщений: ' + error.message)
      else if (isMounted && data) setMessages(data)
    })()

    const unsubscribe = subscribeToMessages(objectIdToUse, (payload) => {
      setMessages((prev) => [...prev, payload.new])
    })

    return () => {
      isMounted = false
      unsubscribe && unsubscribe()
    }
  }, [objectIdToUse, fetchMessages, subscribeToMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const file = fileRef.current?.files[0]
    if (!content.trim() && !file) return

    const { data, error } = await sendMessage({
      objectId: objectIdToUse,
      sender: currentSender,
      content,
      file,
    })

    if (error) toast.error('Ошибка отправки: ' + error.message)
    else {
      setMessages((prev) => [...prev, data])
      setContent('')
      if (fileRef.current) fileRef.current.value = ''
 main
    }
  }

  return (
    <div className="flex flex-col h-full">
 codex/update-chattab-test-cases
      <div className="flex-1 overflow-y-auto space-y-2 mb-4">

      <div className="flex-1 overflow-y-auto space-y-2 p-4">
 main
        {messages.map((m) => (
          <ChatCard key={m.id} message={m} />
        ))}
        <div ref={messagesEndRef} />
      </div>
 codex/update-chattab-test-cases
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

      <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
        <input
          type="text"
          className="input input-bordered flex-1"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Сообщение"
        />
        <input
          type="file"
          ref={fileRef}
          className="file-input file-input-bordered"
        />
        <button type="submit" className="btn btn-primary">
 main
          Отправить
        </button>
      </form>
    </div>
  )
}

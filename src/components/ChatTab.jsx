import React, { useEffect, useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { v4 as uuidv4 } from 'uuid'

export default function ChatTab({ selected }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef(null)

  // Загрузка существующих сообщений и подписка на новые
  useEffect(() => {
    if (!selected) {
      setMessages([])
      return
    }
    const objectId = selected.id

    // initial fetch
    supabase
      .from('chat_messages')
      .select('*')
      .eq('object_id', objectId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Fetch messages error:', error)
        else setMessages(data)
      })

    // realtime subscription via channel
    const channel = supabase
      .channel(`chat_messages_object_${objectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `object_id=eq.${objectId}`
      }, payload => {
        setMessages(prev => [...prev, payload.new])
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selected])

  // автоскролл вниз при новых сообщениях
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // отправка сообщения и файла
  const sendMessage = async () => {
    if (!newMessage.trim() && !file) return

    let fileUrl = null
    if (file) {
      setUploading(true)
      const filePath = `${selected.id}/${uuidv4()}_${file.name}`
      const { error: upErr } = await supabase.storage
        .from('chat-files')
        .upload(filePath, file)
      if (upErr) console.error('Upload error:', upErr)
      else {
        const { data } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath)
        fileUrl = data.publicUrl
      }
      setUploading(false)
    }

    const { error: msgErr } = await supabase
      .from('chat_messages')
      .insert([{ object_id: selected.id, sender: 'user', content: newMessage.trim(), file_url: fileUrl }])
    if (msgErr) console.error('Insert message error:', msgErr)

    setNewMessage('')
    setFile(null)
  }

  // отправка по Enter
  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Список сообщений */}
      <div className="flex-1 overflow-auto p-2 space-y-2 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-gray-500 text-center mt-10">
            Нет сообщений. Начните диалог ниже.
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="bg-white p-3 rounded shadow">
            <div className="text-xs text-gray-500 mb-1">
              {new Date(msg.created_at).toLocaleString()}
            </div>
            {msg.content && (
              <div className="mb-1 whitespace-pre-line">{msg.content}</div>
            )}
            {msg.file_url && (
              <a
                href={msg.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                📎 Прикрепленный файл
              </a>
            )}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Форма отправки */}
      <div className="p-2 border-t flex flex-col bg-white">
        <textarea
          className="w-full border p-2 rounded mb-2 resize-none"
          rows={2}
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center space-x-2">
          <input
            type="file"
            onChange={e => setFile(e.target.files[0])}
            className="text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={uploading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {uploading ? 'Загрузка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  )
}

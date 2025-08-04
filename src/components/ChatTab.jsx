import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';

export default function ChatTab({ selected }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef(null)

  // Загрузка и подписка на новые сообщения
  useEffect(() => {
    if (!selected) {
      setMessages([])
      return
    }
    const objectId = selected.id

    // начальная загрузка
    supabase
      .from('chat_messages')
      .select('*')
      .eq('object_id', objectId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Fetch messages error:', error)
        else setMessages(data)
      })

    // realtime подписка
    const channel = supabase
      .channel(`chat_messages_object_${objectId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `object_id=eq.${objectId}`
      }, payload => {
        setMessages(prev => {
          // избегаем дублей
          if (prev.some(m => m.id === payload.new.id)) return prev
          return [...prev, payload.new]
        })
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [selected])

  // автоскролл вниз
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

    const { data: inserted, error: msgErr } = await supabase
      .from('chat_messages')
      .insert([
        { object_id: selected.id, sender: 'user', content: newMessage.trim(), file_url: fileUrl }
      ])
      .select()
      .single()

    if (msgErr) console.error('Insert message error:', msgErr)
    else if (inserted) setMessages(prev => [...prev, inserted])

    setNewMessage('')
    setFile(null)
  }

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Сообщения */}
      <div className="flex-1 overflow-auto p-2 bg-gray-100">
        {messages.length === 0 && (
          <div className="text-gray-500 text-center mt-4">
            Нет сообщений. Начните диалог.
          </div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex mb-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] sm:max-w-[60%] break-words p-3 rounded-lg shadow ${
                msg.sender === 'user' ? 'bg-blue-100 text-right' : 'bg-white text-left'
              }`.replace(/\s+/g, ' ')}
            >
              <div className="text-xs text-gray-500 mb-1">
                {new Date(msg.created_at).toLocaleString()}
              </div>
              {msg.content && <div className="whitespace-pre-line mb-1">{msg.content}</div>}
              {msg.file_url && (
                <a
                  href={msg.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline block"
                >
                  📎 Прикреплённый файл
                </a>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Форма ввода */}
      <div className="p-2 border-t bg-white">
        <textarea
          className="w-full border p-2 rounded mb-2 resize-none"
          rows={2}
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex items-center space-x-2">
          <label className="bg-gray-200 p-2 rounded cursor-pointer text-sm">
            Файл
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
          <button
            onClick={sendMessage}
            disabled={uploading}
            className="w-auto bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {uploading ? 'Загрузка...' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  )
}

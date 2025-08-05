import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { linkifyText } from '../utils/linkify';

const PaperClipIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M18.375 12.739L10.682 20.432C8.92462 22.1893 6.07538 22.1893 4.31802 20.432C2.56066 18.6746 2.56066 15.8254 4.31802 14.068L15.2573 3.12868C16.4289 1.95711 18.3283 1.95711 19.4999 3.12868C20.6715 4.30025 20.6715 6.19975 19.4999 7.37132L8.55158 18.3197M8.56066 18.3107C8.55764 18.3137 8.55462 18.3167 8.55158 18.3197M14.2498 8.37865L6.43934 16.1893C5.85355 16.7751 5.85355 17.7249 6.43934 18.3107C7.02211 18.8934 7.9651 18.8964 8.55158 18.3197"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const PaperAirplaneIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M5.99972 12L3.2688 3.12451C9.88393 5.04617 16.0276 8.07601 21.4855 11.9997C16.0276 15.9235 9.884 18.9535 3.26889 20.8752L5.99972 12ZM5.99972 12L13.5 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export default function ChatTab({ selected, user }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const scrollRef = useRef(null)
  const senderName = user.user_metadata?.username || user.email

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
        { object_id: selected.id, sender: senderName,  content: newMessage.trim(), file_url: fileUrl }
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
          {messages.map(msg => {
            const isOwn = msg.sender === senderName;
            return (
              <div
                key={msg.id}
                className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] sm:max-w-[60%] break-words p-3 shadow ${
                    isOwn
                      ? 'bg-green-100 text-right rounded-l-lg rounded-t-lg rounded-br-none'
                      : 'bg-white text-left rounded-r-lg rounded-t-lg rounded-bl-none'
                  }`.replace(/\s+/g, ' ')}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {msg.sender} • {new Date(msg.created_at).toLocaleString()}
                  </div>
                  {msg.content && (
                    <div
                      className="whitespace-pre-line break-words mb-1"
                      dangerouslySetInnerHTML={{ __html: linkifyText(msg.content) }}
                    />
                  )}
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
            );
          })}
        <div ref={scrollRef} />
      </div>

      {/* Форма ввода */}
      <div className="p-2 border-t bg-white">
        <div className="flex items-end space-x-2">
          <label className="p-2 cursor-pointer text-gray-500 hover:text-gray-700">
            <PaperClipIcon />
            <input
              type="file"
              onChange={e => setFile(e.target.files[0])}
              className="hidden"
            />
          </label>
          <textarea
            className="flex-1 border rounded-lg p-2 resize-none"
            rows={2}
            placeholder="Введите сообщение..."
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={uploading}
            className="p-2 bg-green-500 text-white rounded-full disabled:opacity-50"
          >
            {uploading ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
            ) : (
              <PaperAirplaneIcon />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

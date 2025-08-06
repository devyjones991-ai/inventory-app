import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { linkifyText } from '../utils/linkify';
import { PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import AttachmentPreview from './AttachmentPreview';

export default function ChatTab({ selected, user }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [modalImage, setModalImage] = useState(null)
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `object_id=eq.${objectId}`
        },
        payload => {
          setMessages(prev => {
            // избегаем дублей
            if (prev.some(m => m.id === payload.new.id)) return prev
            return [...prev, payload.new]
          })
        }
      )
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('Chat realtime channel subscribed')
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Chat realtime channel error:', status)
          toast.error('Не удалось подключиться к real-time каналу')
        }
      })

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
      try {
        const { error: upErr } = await supabase.storage
          .from('chat-files')
          .upload(filePath, file)

        if (upErr) throw upErr

        const { data } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath)
        fileUrl = data.publicUrl
      } catch (err) {
        console.error('Upload error:', err)
        toast.error('Ошибка загрузки файла')
        setUploading(false)
        return
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
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
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
                    <div className="whitespace-pre-line break-words mb-1">
                      {linkifyText(msg.content)}
                    </div>
                  )}
                  {msg.file_url && (
                  codex/add-video-file-handling-in-attachmentpreview
                    <AttachmentPreview url={msg.file_url} />

                    <AttachmentPreview url={msg.file_url} onImageClick={setModalImage} />
main
                  )}
                </div>
              </motion.div>
            );
          })}
        <div ref={scrollRef} />
      </div>

      {/* Форма ввода */}
      <div className="p-2 border-t bg-white">
        <div className="flex items-end space-x-2">
          <label className="p-2 cursor-pointer text-gray-500 hover:text-gray-700">
            <PaperClipIcon className="w-6 h-6" />
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
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {modalImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <button
            aria-label="Close"
            className="absolute top-4 right-4 text-white text-2xl"
            onClick={() => setModalImage(null)}
          >
            ×
          </button>
          <img src={modalImage} alt="preview" className="max-h-full max-w-full" />
        </div>
      )}
    </div>
  )
}

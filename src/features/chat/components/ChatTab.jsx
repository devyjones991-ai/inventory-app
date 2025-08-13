import React, { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '@/supabaseClient'
import { handleSupabaseError } from '@/utils/handleSupabaseError'
import { linkifyText } from '@/utils/linkify.jsx'
import AttachmentPreview from './AttachmentPreview.jsx'
import { useChatMessages } from '../hooks/useChatMessages'
import { PaperClipIcon } from '@heroicons/react/24/outline'

export default function ChatTab({ selected, userEmail }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const scrollRef = useRef(null)
  const channelRef = useRef(null)
  const fileInputRef = useRef(null)
  const { sendMessage } = useChatMessages()

  const objectId = selected?.id || null

  // Прокрутка вниз при каждом обновлении сообщений
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  useEffect(() => {
    if (!file) {
      setFilePreview(null)
      return
    }
    if (typeof URL.createObjectURL === 'function') {
      const url = URL.createObjectURL(file)
      setFilePreview(url)
      return () => URL.revokeObjectURL && URL.revokeObjectURL(url)
    }
  }, [file])

  const loadMessages = useCallback(async () => {
    if (!objectId) return
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('object_id', objectId)
      .order('created_at', { ascending: true })

    if (error) {
      await handleSupabaseError(error, null, 'Ошибка загрузки сообщений')
      return
    }
    setMessages(data || [])
  }, [objectId])

  const markMessagesAsRead = useCallback(async () => {
    if (!objectId) return
    await supabase
      .from('chat_messages')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null)
      .eq('object_id', objectId)
      .neq('sender', userEmail)
  }, [objectId, userEmail])

  // Инициализация: загрузка + подписка на realtime
  useEffect(() => {
    // очистка старого канала при смене объекта
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    setMessages([])
    if (!objectId) return

    loadMessages()

    // ВАЖНО: подписка через supabase.channel + postgres_changes (новый API)
    const ch = supabase
      .channel(`chat:${objectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `object_id=eq.${objectId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new].sort(sortByCreatedAt))
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev
                .map((m) => (m.id === payload.new.id ? payload.new : m))
                .sort(sortByCreatedAt),
            )
          } else if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // доп. загрузка на всякий, если кэш пустой
          loadMessages()
        }
      })

    channelRef.current = ch

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [objectId, loadMessages])

  useEffect(() => {
    markMessagesAsRead()
  }, [messages, markMessagesAsRead])

  const handleSend = async () => {
    if (!objectId || (!newMessage.trim() && !file) || sending) return
    setSending(true)

    if (file) {
      const { error } = await sendMessage({
        objectId,
        sender: userEmail,
        content: newMessage.trim(),
        file,
      })
      if (error) {
        await handleSupabaseError(error, null, 'Ошибка отправки')
      }
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setNewMessage('')
      setSending(false)
      return
    }

    const optimistic = {
      id: `tmp-${Date.now()}`,
      object_id: objectId,
      sender: userEmail,
      content: newMessage.trim(),
      file_url: null,
      created_at: new Date().toISOString(),
      _optimistic: true,
    }
    setMessages((prev) => [...prev, optimistic])

    const { error } = await supabase
      .from('chat_messages')
      .insert([
        { object_id: objectId, sender: userEmail, content: newMessage.trim() },
      ])

    if (error) {
      await handleSupabaseError(error, null, 'Ошибка отправки')
      // откатываем оптимистичную запись
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
    }
    setNewMessage('')
    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!objectId) {
    return (
      <div className="p-6 text-sm text-base-content/70 transition-colors">
        Выбери объект
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-base-200 rounded-2xl"
      >
        {messages.length === 0 ? (
          <div className="text-sm text-gray-400">
            Сообщений пока нет — напиши первым.
          </div>
        ) : (
          messages.map((m) => {
            const isOwn = m.sender === userEmail
            const dt = new Date(m.created_at)
            const date = dt.toLocaleDateString()
            const time = dt.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
            return (
              <div
                key={m.id}
                className={`chat ${isOwn ? 'chat-end' : 'chat-start'}`}
              >
                {!isOwn && (
                  <div className="chat-header">{m.sender || 'user'}</div>
                )}
                <div
                  className={`chat-bubble whitespace-pre-wrap break-words rounded-2xl shadow-md px-4 py-2 flex flex-col ${
                    isOwn
                      ? 'bg-primary text-primary-content'
                      : 'bg-base-100 text-base-content'
                  }`}
                >
                  {m.content && (
                    <span className="whitespace-pre-wrap break-words">
                      {linkifyText(m.content)}
                    </span>
                  )}
                  {m.file_url && (
                    <div className="mt-2">
                      <AttachmentPreview url={m.file_url} />
                    </div>
                  )}
                  <span className="self-end mt-1 text-xs opacity-60">
                    {`${date} ${time}`}
                    {m.read_at ? ' ✓' : ''}
                    {m._optimistic ? ' • отправка…' : ''}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="p-3 border-t space-y-2">
        {file && filePreview && <AttachmentPreview url={filePreview} />}
        <div className="flex items-center gap-2">
          <label
            htmlFor="chat-file-input"
            className="btn btn-ghost"
            data-testid="file-label"
            aria-label="Прикрепить файл"
            title="Прикрепить файл"
            role="button"
            tabIndex={0}
          >
            <PaperClipIcon className="w-6 h-6" />
          </label>
          <input
            id="chat-file-input"
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => setFile(e.target.files[0])}
          />
          <textarea
            className="textarea textarea-bordered w-full min-h-24"
            placeholder="Напиши сообщение… (Enter — отправить, Shift+Enter — новая строка)"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            disabled={sending || (!newMessage.trim() && !file)}
            onClick={handleSend}
          >
            {sending ? 'Отправка…' : 'Отправить'}
          </button>
        </div>
      </div>
    </div>
  )
}

function sortByCreatedAt(a, b) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import { handleSupabaseError } from '../utils/handleSupabaseError'

export default function ChatTab({ selected }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const channelRef = useRef(null)

  const objectId = selected?.id || null

  // Прокрутка вниз при каждом обновлении сообщений
  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

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

  const handleSend = async () => {
    if (!objectId || !newMessage.trim() || sending) return
    setSending(true)

    const optimistic = {
      id: `tmp-${Date.now()}`,
      object_id: objectId,
      sender: 'me',
      content: newMessage.trim(),
      file_url: null,
      created_at: new Date().toISOString(),
      _optimistic: true,
    }
    setMessages((prev) => [...prev, optimistic])

    const { error } = await supabase
      .from('chat_messages')
      .insert([
        { object_id: objectId, sender: 'me', content: newMessage.trim() },
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
    return <div className="p-6 text-sm text-gray-500">Выбери объект</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-sm text-gray-400">
            Сообщений пока нет — напиши первым.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="chat chat-start">
              <div className="chat-header">{m.sender || 'user'}</div>
              <div className="chat-bubble whitespace-pre-wrap">{m.content}</div>
              <div className="chat-footer opacity-50 text-xs">
                {new Date(m.created_at).toLocaleString()}
                {m._optimistic ? ' • отправка…' : ''}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t space-y-2">
        <textarea
          className="textarea textarea-bordered w-full min-h-24"
          placeholder="Напиши сообщение… (Enter — отправить, Shift+Enter — новая строка)"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            disabled={sending || !newMessage.trim()}
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

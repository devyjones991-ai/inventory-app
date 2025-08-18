import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { handleSupabaseError } from '../utils/handleSupabaseError'
import { useChatMessages } from './useChatMessages.js'

export default function useChat({ objectId, userEmail }) {
  const [messages, setMessages] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const scrollRef = useRef(null)
  const channelRef = useRef(null)
  const fileInputRef = useRef(null)
  const { fetchMessages } = useChatMessages()
  const LIMIT = 20

  const offsetRef = useRef(0)

  /**
   * Загружает следующую порцию сообщений, используя внутреннее смещение.
   * Позволяет реализовать постраничную подгрузку без передачи параметров.
   */
  const loadMore = useCallback(async () => {
    if (!objectId) return
    const { data, error } = await fetchMessages(objectId, {
      limit: LIMIT,
      offset: offsetRef.current,
    })
    if (error) {
      await handleSupabaseError(error, null, 'Ошибка загрузки сообщений')
      return
    }
    offsetRef.current += data?.length || 0
    setMessages((prev) => [...(data || []), ...prev])
    if (!data || data.length < LIMIT) setHasMore(false)
  }, [objectId, fetchMessages])

  const markMessagesAsRead = useCallback(async () => {
    if (!objectId) return
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null)
        .eq('object_id', objectId)

      if (error) {
        await handleSupabaseError(
          error,
          null,
          'Ошибка отметки сообщений как прочитанных',
        )
      }
    } catch (error) {
      await handleSupabaseError(
        error,
        null,
        'Ошибка отметки сообщений как прочитанных',
      )
    }
  }, [objectId])

  // Автоскролл к новому сообщению
  const autoScrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current
      const isNearBottom =
        scrollElement.scrollTop >=
        scrollElement.scrollHeight - scrollElement.clientHeight - 100
      if (isNearBottom) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [])

  // Handle file preview
  useEffect(() => {
    if (!file) {
      setFilePreview(null)
      return
    }
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setFilePreview(url)
      return () => URL.revokeObjectURL && URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(
    () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }

      setMessages([])
      setHasMore(true)
      offsetRef.current = 0
      if (!objectId) return

      // loadMore() вызывает двойную загрузку при инициализации,
      // поэтому оставляем вызов только после подписки на канал
      // loadMore()

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
              setMessages((prev) => {
                const existingIndex = prev.findIndex(
                  (m) =>
                    m._optimistic &&
                    m.sender === payload.new.sender &&
                    m.content === payload.new.content,
                )

                if (existingIndex !== -1) {
                  const updated = [...prev]
                  updated[existingIndex] = payload.new
                  return updated.sort(sortByCreatedAt)
                }

                offsetRef.current += 1
                return [...prev, payload.new].sort(sortByCreatedAt)
              })
            }
            if (payload.eventType === 'UPDATE') {
              setMessages((prev) =>
                prev
                  .map((m) => (m.id === payload.old.id ? payload.new : m))
                  .sort(sortByCreatedAt),
              )
            }
            if (payload.eventType === 'DELETE') {
              offsetRef.current -= 1
              setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
            }
          },
        )
        .subscribe((status) => {
          console.log('Channel status:', status)
          if (status === 'SUBSCRIBED') {
            loadMore() // Загружаем сообщения только после подписки
          }
        })

      channelRef.current = ch

      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current)
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [objectId],
  )

  useEffect(() => {
    autoScrollToBottom()
  }, [messages, autoScrollToBottom])

  // Markiere Nachrichten als gelesen wenn das Fenster sichtbar ist
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && messages.length > 0) {
        markMessagesAsRead()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [messages, markMessagesAsRead])

  const handleSend = async () => {
    if ((!newMessage.trim() && !file) || sending) return

    setSending(true)
    const optimisticId = Date.now() + Math.random()
    const optimistic = {
      id: optimisticId,
      object_id: objectId,
      sender: userEmail,
      content: newMessage.trim(),
      file_url: file ? URL.createObjectURL(file) : null,
      file_name: file?.name || null,
      file_size: file?.size || null,
      file_type: file?.type || null,
      created_at: new Date().toISOString(),
      _optimistic: true,
    }
    offsetRef.current += 1
    setMessages((prev) => [...prev, optimistic])

    const { error } = await supabase
      .from('chat_messages')
      .insert([
        { object_id: objectId, sender: userEmail, content: newMessage.trim() },
      ])

    if (error) {
      await handleSupabaseError(error, null, 'Ошибка отправки')
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

  return {
    messages,
    hasMore,
    loadMore,
    newMessage,
    setNewMessage,
    sending,
    file,
    setFile,
    filePreview,
    handleSend,
    handleKeyDown,
    fileInputRef,
    scrollRef,
    markMessagesAsRead,
  }
}

function sortByCreatedAt(a, b) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

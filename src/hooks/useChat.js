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
  const { fetchMessages, sendMessage } = useChatMessages()
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
    setMessages((prev) => [...(data || []), ...prev].sort(sortByCreatedAt))
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
        .neq('sender', userEmail)

      if (error) throw error
    } catch (error) {
      await handleSupabaseError(
        error,
        null,
        'Ошибка отметки сообщений как прочитанных',
      )
    }
  }, [objectId, userEmail])

  const lastMessageIdRef = useRef(null)
  useEffect(() => {
    if (!scrollRef.current) return
    const lastId = messages[messages.length - 1]?.id
    if (lastId && lastId !== lastMessageIdRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      lastMessageIdRef.current = lastId
    }
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

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    setMessages([])
    setHasMore(true)
    offsetRef.current = 0
    if (!objectId) return

    loadMore()

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
            offsetRef.current += 1
            setMessages((prev) => {
              const optimisticIndex = prev.findIndex(
                (m) =>
                  m._optimistic &&
                  m.sender === payload.new.sender &&
                  Math.abs(
                    new Date(m.created_at).getTime() -
                      new Date(payload.new.created_at).getTime(),
                  ) < 5000,
              )
              if (optimisticIndex !== -1) {
                const updated = [...prev]
                updated[optimisticIndex] = payload.new
                return updated.sort(sortByCreatedAt)
              }
              return [...prev, payload.new].sort(sortByCreatedAt)
            })
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
          loadMore()
        }
      })

    channelRef.current = ch

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [objectId, loadMore])

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
  }
}

function sortByCreatedAt(a, b) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

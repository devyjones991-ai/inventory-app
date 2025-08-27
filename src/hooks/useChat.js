import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/supabaseClient'
import { handleSupabaseError } from '@/utils/handleSupabaseError'
import { useChatMessages } from './useChatMessages.js'

export default function useChat({ objectId, userEmail, search }) {
  const [messages, setMessages] = useState([])
  const [hasMore, setHasMore] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const scrollRef = useRef(null)
  const channelRef = useRef(null)
  const fileInputRef = useRef(null)
  const optimisticTimersRef = useRef({})
  const { fetchMessages, sendMessage } = useChatMessages()
  const LIMIT = 20

  const offsetRef = useRef(0)
  const isInitialRender = useRef(true)
  const activeSearchRef = useRef(search)

  /**
   * Загружает следующую порцию сообщений, используя внутреннее смещение.
   * Позволяет реализовать постраничную подгрузку без передачи параметров.
   */
  const loadMore = useCallback(
    async (replace = false) => {
      if (!objectId) return
      const currentSearch = search
      const params = { limit: LIMIT, offset: offsetRef.current }
      if (currentSearch) params.search = currentSearch
      const { data, error } = await fetchMessages(objectId, params)
      if (currentSearch !== activeSearchRef.current) return
      if (error) {
        console.error('loadMore error', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        })
        setLoadError(error)
        await handleSupabaseError(error, null, 'Ошибка загрузки сообщений')
        return { error }
      }
      setLoadError(null)
      offsetRef.current += data?.length || 0
      if (replace) {
        setMessages(data || [])
      } else {
        setMessages((prev) => [...(data || []), ...prev])
      }
      if (!data || data.length < LIMIT) setHasMore(false)
    },
    [objectId, fetchMessages, search],
  )

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
  const autoScrollToBottom = useCallback((force = false) => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current
      if (force) {
        scrollElement.scrollTop = scrollElement.scrollHeight
        return
      }
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

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    setMessages([])
    setHasMore(true)
    offsetRef.current = 0
    if (!objectId) return

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
              if (prev.some((m) => m.id === payload.new.id)) {
                return prev
              }

              const existingIndex = prev.findIndex(
                (m) =>
                  m.client_generated_id === payload.new.client_generated_id,
              )

              if (existingIndex !== -1) {
                const updated = [...prev]
                updated[existingIndex] = payload.new
                const timer =
                  optimisticTimersRef.current[payload.new.client_generated_id]
                if (timer) {
                  clearTimeout(timer)
                  delete optimisticTimersRef.current[
                    payload.new.client_generated_id
                  ]
                }
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
          loadMore().then(() => {
            setTimeout(() => autoScrollToBottom(true), 0)
          })
        }
      })

    channelRef.current = ch

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [objectId, loadMore, autoScrollToBottom])

  const searchInitRef = useRef(false)
  useEffect(() => {
    if (!searchInitRef.current) {
      searchInitRef.current = true
      activeSearchRef.current = search
      return
    }
    activeSearchRef.current = search
    setMessages([])
    setHasMore(true)
    offsetRef.current = 0
    if (objectId) loadMore(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => {
    if (isInitialRender.current) {
      autoScrollToBottom(true)
      isInitialRender.current = false
    } else {
      autoScrollToBottom()
    }
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
      client_generated_id: optimisticId,
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

    optimisticTimersRef.current[optimisticId] = setTimeout(() => {
      setMessages((prev) =>
        prev.filter((m) => m.client_generated_id !== optimisticId),
      )
      offsetRef.current -= 1
      delete optimisticTimersRef.current[optimisticId]
    }, 5000)

    const { data, error } = await sendMessage({
      objectId,
      sender: userEmail,
      content: newMessage.trim(),
      file,
    })

    const timer = optimisticTimersRef.current[optimisticId]

    if (error) {
      await handleSupabaseError(error, null, 'Ошибка отправки')
      if (timer) {
        clearTimeout(timer)
        delete optimisticTimersRef.current[optimisticId]
      }
      setMessages((prev) =>
        prev.filter((m) => m.client_generated_id !== optimisticId),
      )
      offsetRef.current -= 1
    } else {
      if (timer) {
        clearTimeout(timer)
        delete optimisticTimersRef.current[optimisticId]
      }
      setMessages((prev) => {
        const filtered = prev.filter(
          (m) => m.client_generated_id !== optimisticId,
        )
        if (filtered.some((m) => m.id === data.id)) {
          return filtered.sort(sortByCreatedAt)
        }
        return [...filtered, data].sort(sortByCreatedAt)
      })
      if (filePreview) URL.revokeObjectURL(filePreview)
      setFile(null)
      setFilePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
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
    loadError,
  }
}

function sortByCreatedAt(a, b) {
  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../supabaseClient'
import { handleSupabaseError } from '../utils/handleSupabaseError'
import { useChatMessages } from './useChatMessages.js'

export default function useChat({ objectId, userEmail }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const scrollRef = useRef(null)
  const channelRef = useRef(null)
  const fileInputRef = useRef(null)
  const { sendMessage } = useChatMessages()

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

  useEffect(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    setMessages([])
    if (!objectId) return

    loadMessages()

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

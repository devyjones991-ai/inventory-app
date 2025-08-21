import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../supabaseClient'
import {
  requestNotificationPermission,
  pushNotification,
  playTaskSound,
  playMessageSound,
} from '../utils/notifications'

const NOTIF_KEY = 'objectNotifications'

export function useObjectNotifications(selected, activeTab, user) {
  const [notifications, setNotifications] = useState(() => {
    if (typeof localStorage === 'undefined') return {}
    try {
      return JSON.parse(localStorage.getItem(NOTIF_KEY)) || {}
    } catch {
      return {}
    }
  })

  const selectedRef = useRef(selected)
  const tabRef = useRef(activeTab)
  const userRef = useRef(user)

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])
  useEffect(() => {
    tabRef.current = activeTab
  }, [activeTab])
  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notifications))
    }
  }, [notifications])

  useEffect(() => {
    requestNotificationPermission()
  }, [])

  useEffect(() => {
    const tasksChannel = supabase
      .channel('tasks_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks' },
        (payload) => {
          const objId = payload.new.object_id
          const isCurrent =
            selectedRef.current?.id === objId && tabRef.current === 'tasks'
          setNotifications((prev) => {
            if (isCurrent) return prev
            return { ...prev, [objId]: (prev[objId] || 0) + 1 }
          })
          if (!isCurrent) {
            toast.success(`Добавлена задача: ${payload.new.title}`)
            pushNotification('Новая задача', payload.new.title)
            playTaskSound()
          }
        },
      )
      .subscribe()

    const chatChannel = supabase
      .channel('chat_all')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const objId = payload.new.object_id
          const sender = payload.new.sender
          const currentUser =
            userRef.current?.user_metadata?.username || userRef.current?.email
          if (sender === currentUser) return
          const isCurrent =
            selectedRef.current?.id === objId && tabRef.current === 'chat'
          setNotifications((prev) => {
            if (isCurrent) return prev
            return { ...prev, [objId]: (prev[objId] || 0) + 1 }
          })
          if (!isCurrent) {
            toast.success('Новое сообщение в чате')
            const body = payload.new.content || '📎 Файл'
            pushNotification(
              'Новое сообщение',
              `${payload.new.sender}: ${body}`,
            )
            playMessageSound()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(chatChannel)
    }
  }, [])

  const clearNotifications = (objectId) => {
    setNotifications((prev) => {
      if (!prev[objectId]) return prev
      const updated = { ...prev }
      delete updated[objectId]
      return updated
    })
  }

  return { notifications, clearNotifications }
}

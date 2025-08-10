import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabaseClient'
import InventorySidebar from '../components/InventorySidebar'
import InventoryTabs from '../components/InventoryTabs'
import AccountModal from '../components/AccountModal'
import ConfirmModal from '../components/ConfirmModal'
import { toast } from 'react-hot-toast'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import ThemeToggle from '../components/ThemeToggle'
import {
  requestNotificationPermission,
  pushNotification,
  playTaskSound,
  playMessageSound,
} from '../utils/notifications'
import { Navigate, useNavigate } from 'react-router-dom'
import { handleSupabaseError } from '../utils/handleSupabaseError'
import { useAuth } from '../hooks/useAuth'

const SELECTED_OBJECT_KEY = 'selectedObjectId'
const NOTIF_KEY = 'objectNotifications'

export default function DashboardPage() {
  const { user, isAdmin } = useAuth()
  const [objects, setObjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [activeTab, setActiveTab] = useState('desc')
  const [notifications, setNotifications] = useState(() => {
    if (typeof localStorage === 'undefined') return {}
    try {
      return JSON.parse(localStorage.getItem(NOTIF_KEY)) || {}
    } catch {
      return {}
    }
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isObjectModalOpen, setIsObjectModalOpen] = useState(false)
  const [objectName, setObjectName] = useState('')
  const [editingObject, setEditingObject] = useState(null)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const navigate = useNavigate()

  const selectedRef = useRef(null)
  const tabRef = useRef('desc')
  const userRef = useRef(null)
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

  // глобальные уведомления по задачам и сообщениям
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

  // Загрузка списка объектов
  useEffect(() => {
    fetchObjects()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchObjects() {
    const { data, error } = await supabase
      .from('objects')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      if (error.status === 401) {
        await supabase.auth.signOut()
        navigate('/auth')
        return
      }
      if (error.status === 403) {
        toast.error('Недостаточно прав')
        setFetchError('Недостаточно прав')
        return
      }
      console.error('Ошибка загрузки объектов:', error)
      toast.error('Ошибка загрузки объектов: ' + error.message)

      await handleSupabaseError(error, navigate, 'Ошибка загрузки объектов')

      setFetchError('Ошибка загрузки объектов: ' + error.message)
      return
    } else {
      setObjects(data)
      const savedId =
        typeof localStorage !== 'undefined'
          ? localStorage.getItem(SELECTED_OBJECT_KEY)
          : null
      if (savedId) {
        const saved = data.find((o) => o.id === Number(savedId))
        if (saved) setSelected(saved)
        else if (!selected && data.length) setSelected(data[0])
      } else if (!selected && data.length) {
        setSelected(data[0])
      }
    }
  }

  // Добавление/редактирование объекта через модальное окно
  async function saveObject() {
    if (!objectName.trim()) return
    if (editingObject) {
      const { data, error } = await supabase
        .from('objects')
        .update({ name: objectName })
        .eq('id', editingObject.id)
        .select()
        .single()
      if (error) {
        if (error.status === 403) toast.error('Недостаточно прав')
        else toast.error('Ошибка редактирования: ' + error.message)

        await handleSupabaseError(error, navigate, 'Ошибка редактирования')
        return
      } else {
        setObjects((prev) =>
          prev.map((o) => (o.id === editingObject.id ? data : o)),
        )
        if (selected?.id === editingObject.id) setSelected(data)
        setEditingObject(null)
        setObjectName('')
        setIsObjectModalOpen(false)
      }
    } else {
      const { data, error } = await supabase
        .from('objects')
        .insert([{ name: objectName, description: '' }])
        .select()
        .single()
      if (error) {
        if (error.status === 403) toast.error('Недостаточно прав')
        else toast.error('Ошибка добавления: ' + error.message)

        await handleSupabaseError(error, navigate, 'Ошибка добавления')
        return
      } else {
        setObjects((prev) => [...prev, data])
        setSelected(data)
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(SELECTED_OBJECT_KEY, data.id)
        }
        setObjectName('')
        setIsObjectModalOpen(false)
      }
    }
  }

  // Запрос на удаление с подтверждением
  function askDelete(id) {
    setDeleteCandidate(id)
  }

  async function confirmDelete() {
    const id = deleteCandidate
    const { error } = await supabase.from('objects').delete().eq('id', id)
    if (error) {
      if (error.status === 403) toast.error('Недостаточно прав')
      else toast.error('Ошибка удаления: ' + error.message)

      await handleSupabaseError(error, navigate, 'Ошибка удаления')
      return
    } else {
      setObjects((prev) => {
        const updated = prev.filter((o) => o.id !== id)
        if (selected?.id === id) {
          const next = updated[0] || null
          setSelected(next)
          if (typeof localStorage !== 'undefined') {
            if (next) localStorage.setItem(SELECTED_OBJECT_KEY, next.id)
            else localStorage.removeItem(SELECTED_OBJECT_KEY)
          }
        }
        return updated
      })
      setDeleteCandidate(null)
      toast.success('Объект удалён')
    }
  }

  // Открытие модального окна для редактирования объекта
  function editObject(obj) {
    setEditingObject(obj)
    setObjectName(obj.name)
    setIsObjectModalOpen(true)
  }

  function handleSelect(obj) {
    setSelected(obj)
    clearNotifications(obj.id)
    setActiveTab('desc')
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SELECTED_OBJECT_KEY, obj.id)
    }
    // закрываем сайдбар на мобильных устройствах после выбора объекта
    setIsSidebarOpen(false)
  }

  function handleUpdateSelected(updated) {
    setSelected(updated)
    clearNotifications(updated.id)
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SELECTED_OBJECT_KEY, updated.id)
    }
    setObjects((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
  }

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev)
  }

  function handleUserUpdated() {}

  function handleTabChange(tab) {
    setActiveTab(tab)
    if ((tab === 'tasks' || tab === 'chat') && selected) {
      clearNotifications(selected.id)
    }
  }

  function clearNotifications(objectId) {
    setNotifications((prev) => {
      if (!prev[objectId]) return prev
      const updated = { ...prev }
      delete updated[objectId]
      return updated
    })
  }

  if (!user) return <Navigate to="/auth" replace />

  if (fetchError) {
    return (
      <div className="flex w-full min-h-screen items-center justify-center bg-base-100 text-red-500">
        {fetchError}
      </div>
    )
  }

  if (!selected) {
    return (
      <div className="flex w-full min-h-screen items-center justify-center bg-base-100 text-gray-500">
        Загрузка объектов...
      </div>
    )
  }

  return (
    <>
      <div className="flex h-screen bg-base-100 transition-colors">
        {/* Десктоп- и мобайл-сайдбар */}
        <aside className="hidden md:flex flex-col w-72 bg-base-200 p-4 border-r shadow-lg overflow-y-auto transition-colors">
          <InventorySidebar
            objects={objects}
            selected={selected}
            onSelect={handleSelect}
            onEdit={editObject}
            onDelete={askDelete}
            notifications={notifications}
            isAdmin={isAdmin}
          />
        </aside>
        {isSidebarOpen && (
          <div className="fixed inset-0 z-10 flex">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={toggleSidebar}
            />
            <aside className="relative z-20 w-72 bg-base-200 p-4 shadow-lg overflow-y-auto transition-colors">
              <button
                className="btn btn-circle btn-md md:btn-sm absolute right-2 top-2"
                onClick={toggleSidebar}
              >
                ✕
              </button>
              <InventorySidebar
                objects={objects}
                selected={selected}
                onSelect={handleSelect}
                onEdit={editObject}
                onDelete={askDelete}
                notifications={notifications}
                isAdmin={isAdmin}
              />
            </aside>
          </div>
        )}

        {/* Основная часть */}
        <div className="flex-1 flex flex-col">
          {/* Хэдер с одной фиолетовой кнопкой */}
          <header className="flex flex-col xs:items-start xs:gap-2 md:flex-row items-center justify-between p-4 border-b bg-base-100 transition-colors">
            <div className="flex items-center gap-2">
              <button className="md:hidden p-2 text-lg" onClick={toggleSidebar}>
                ☰
              </button>
              {isAdmin && (
                <button
                  className="btn btn-primary btn-md md:btn-sm flex items-center gap-1"
                  onClick={() => {
                    setEditingObject(null)
                    setObjectName('')
                    setIsObjectModalOpen(true)
                  }}
                >
                  <PlusIcon className="w-4 h-4" /> Добавить
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                className="btn btn-md md:btn-sm p-2 text-lg md:text-sm"
                onClick={() => setIsAccountModalOpen(true)}
              >
                {user.user_metadata?.username || 'Аккаунт'}
              </button>
              <button
                className="btn btn-md md:btn-sm p-2 text-lg md:text-sm"
                onClick={() => supabase.auth.signOut()}
              >
                Выйти
              </button>
            </div>
          </header>

          {/* Контент табов */}
          <div className="flex-1 overflow-auto">
            <InventoryTabs
              selected={selected}
              onUpdateSelected={handleUpdateSelected}
              isAdmin={isAdmin}
              onTabChange={handleTabChange}
            />
          </div>
        </div>

        {/* Модальное добавление/редактирование объекта */}
        {isObjectModalOpen && (
          <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-box relative w-full max-w-md">
              <button
                className="btn btn-circle btn-md md:btn-sm absolute right-2 top-2"
                onClick={() => setIsObjectModalOpen(false)}
              >
                ✕
              </button>
              <h3 className="font-bold text-lg mb-4">
                {editingObject ? 'Редактировать объект' : 'Добавить объект'}
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Название"
                  value={objectName}
                  onChange={(e) => setObjectName(e.target.value)}
                />
              </div>
              <div className="modal-action flex space-x-2">
                <button className="btn btn-primary" onClick={saveObject}>
                  Сохранить
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setIsObjectModalOpen(false)}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        <ConfirmModal
          open={!!deleteCandidate}
          title="Удалить объект?"
          confirmLabel={
            <>
              <TrashIcon className="w-4 h-4" /> Удалить
            </>
          }
          onConfirm={confirmDelete}
          onCancel={() => setDeleteCandidate(null)}
        />

        {isAccountModalOpen && (
          <AccountModal
            user={user}
            onClose={() => setIsAccountModalOpen(false)}
            onUpdated={handleUserUpdated}
          />
        )}
      </div>
    </>
  )
}

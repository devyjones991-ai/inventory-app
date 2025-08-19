import React, { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '../supabaseClient'
import { handleSupabaseError } from '../utils/handleSupabaseError'
import HardwareCard from './HardwareCard'
import TaskCard from './TaskCard'
import ChatTab from './ChatTab'
import { PlusIcon, ChatBubbleOvalLeftIcon } from '@heroicons/react/24/outline'
import { linkifyText } from '../utils/linkify'
import { toast } from 'react-hot-toast'
import ConfirmModal from './ConfirmModal'
import Spinner from './Spinner'
import ErrorMessage from './ErrorMessage'
import { useHardware } from '../hooks/useHardware'
import { useTasks } from '../hooks/useTasks'
import { useChatMessages } from '../hooks/useChatMessages'
import { useObjects } from '../hooks/useObjects'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { apiBaseUrl, isApiConfigured } from '../apiConfig'

const TAB_KEY = (objectId) => `tab_${objectId}`
const HW_MODAL_KEY = (objectId) => `hwModal_${objectId}`
const HW_FORM_KEY = (objectId) => `hwForm_${objectId}`
const TASK_MODAL_KEY = (objectId) => `taskModal_${objectId}`
const TASK_FORM_KEY = (objectId) => `taskForm_${objectId}`
const PAGE_SIZE = 20

// форматирование даты для отображения в русской локали
function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU')
  } catch {
    return dateStr
  }
}

const defaultHWForm = {
  name: '',
  location: '',
  purchase_status: 'не оплачен',
  install_status: 'не установлен',
}

const hardwareSchema = z.object({
  name: z.string().min(1, 'Введите название'),
  location: z.string().optional(),
  purchase_status: z.enum(['не оплачен', 'оплачен'], {
    message: 'Недопустимый статус покупки',
  }),
  install_status: z.enum(['не установлен', 'установлен'], {
    message: 'Недопустимый статус установки',
  }),
})

const defaultTaskForm = {
  title: '',
  status: 'запланировано',
  assignee: '',
  assignee_id: '',
  due_date: '',
  notes: '',
}

const taskSchema = z.object({
  title: z.string().min(1, 'Введите название'),
  status: z.enum(['запланировано', 'в процессе', 'завершено'], {
    message: 'Выберите статус',
  }),
  assignee: z.string().optional(),
  assignee_id: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().optional(),
})

function InventoryTabs({ selected, onUpdateSelected, onTabChange = () => {} }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  // --- вкладки и описание ---
  const [tab, setTab] = useState('desc')
  const [description, setDescription] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)

  const showDesc = useCallback(() => setTab('desc'), [])
  const showHW = useCallback(() => setTab('hw'), [])
  const showTasks = useCallback(() => setTab('tasks'), [])
  const showChat = useCallback(() => setTab('chat'), [])

  // --- оборудование ---
  const [hardware, setHardware] = useState([])
  const [isHWModalOpen, setIsHWModalOpen] = useState(false)
  const [editingHW, setEditingHW] = useState(null)
  const {
    register: registerHW,
    handleSubmit: handleSubmitHW,
    reset: resetHW,
    watch: watchHW,
    formState: { errors: hwErrors },
  } = useForm({
    resolver: zodResolver(hardwareSchema),
    defaultValues: defaultHWForm,
  })
  const [hwDeleteId, setHwDeleteId] = useState(null)
  const hwEffectRan = React.useRef(false)
  const [hardwareError, setHardwareError] = useState(null)
  const [hardwarePage, setHardwarePage] = useState(0)
  const [hardwareHasMore, setHardwareHasMore] = useState(true)
  const [loadingHW, setLoadingHW] = useState(false)

  // --- задачи ---
  const [tasks, setTasks] = useState([])
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const {
    register: registerTask,
    handleSubmit: handleSubmitTask,
    reset: resetTask,
    watch: watchTask,
    formState: { errors: taskErrors },
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultTaskForm,
  })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [viewingTask, setViewingTask] = useState(null)
  const [taskDeleteId, setTaskDeleteId] = useState(null)
  const taskEffectRan = React.useRef(false)
  const [tasksError, setTasksError] = useState(null)
  const [tasksPage, setTasksPage] = useState(0)
  const [tasksHasMore, setTasksHasMore] = useState(true)
  const [loadingTasks, setLoadingTasks] = useState(false)

  // --- импорт/экспорт ---
  const [importTable, setImportTable] = useState(null)
  const [importFile, setImportFile] = useState(null)

  // --- чат ---
  const [chatMessages, setChatMessages] = useState([])
  const {
    fetchHardware: fetchHardwareApi,
    insertHardware,
    updateHardware,
    deleteHardware,
  } = useHardware()
  const {
    fetchTasks: fetchTasksApi,
    insertTask,
    updateTask,
    deleteTask,
    subscribeToTasks,
  } = useTasks()
  const { fetchMessages, subscribeToMessages } = useChatMessages()
  const { updateObject } = useObjects()

  useEffect(() => {
    onTabChange(tab)
  }, [tab, onTabChange])

  useEffect(() => {
    if (!selected) return
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TAB_KEY(selected.id), tab)
    }
  }, [tab, selected])

  useEffect(() => {
    if (!selected) return
    if (hwEffectRan.current) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(HW_MODAL_KEY(selected.id), isHWModalOpen)
        if (!isHWModalOpen) {
          localStorage.removeItem(HW_FORM_KEY(selected.id))
        }
      }
    } else {
      hwEffectRan.current = true
    }
  }, [isHWModalOpen, selected])

  useEffect(() => {
    if (!selected || !isHWModalOpen) return
    const sub = watchHW((value) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(HW_FORM_KEY(selected.id), JSON.stringify(value))
      }
    })
    return () => sub.unsubscribe()
  }, [watchHW, selected, isHWModalOpen])

  useEffect(() => {
    if (!selected) return
    if (taskEffectRan.current) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TASK_MODAL_KEY(selected.id), isTaskModalOpen)
        if (!isTaskModalOpen) {
          localStorage.removeItem(TASK_FORM_KEY(selected.id))
        }
      }
    } else {
      taskEffectRan.current = true
    }
  }, [isTaskModalOpen, selected])

  useEffect(() => {
    if (!selected || !isTaskModalOpen) return
    const sub = watchTask((value) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TASK_FORM_KEY(selected.id), JSON.stringify(value))
      }
    })
    return () => sub.unsubscribe()
  }, [watchTask, selected, isTaskModalOpen])

  // realtime обновление задач и чата
  useEffect(() => {
    if (!selected) return
    const unsubscribeTasks = subscribeToTasks(selected.id, (payload) => {
      setTasks((prev) => {
        if (payload.eventType === 'INSERT') {
          if (prev.some((t) => t.id === payload.new.id)) return prev
          return [...prev, payload.new]
        }
        if (payload.eventType === 'UPDATE') {
          return prev.map((t) =>
            t.id === payload.new.id ? { ...t, ...payload.new } : t,
          )
        }
        if (payload.eventType === 'DELETE') {
          return prev.filter((t) => t.id !== payload.old.id)
        }
        return prev
      })
    })

    const unsubscribeChat = subscribeToMessages(selected.id, (payload) => {
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === payload.new.id)) return prev
        return [...prev, payload.new]
      })
    })

    return () => {
      unsubscribeTasks()
      unsubscribeChat()
    }
  }, [selected, subscribeToMessages, subscribeToTasks])

  // --- CRUD Описание ---
  async function saveDescription() {
    const { data, error } = await updateObject(selected.id, { description })
    if (!error) {
      onUpdateSelected({ ...selected, description: data.description })
      setIsEditingDesc(false)
    } else {
      if (error.status === 403) toast.error('Недостаточно прав')
      else toast.error('Ошибка сохранения описания: ' + error.message)
    }
  }

  // --- CRUD Оборудование ---

  const fetchHardware = useCallback(
    async (objectId, page = hardwarePage) => {
      setLoadingHW(true)
      setHardwareError(null)
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data, error } = await supabase
        .from('hardware')
        .select('id, name, location, purchase_status, install_status')
        .eq('object_id', objectId)
        .order('created_at')
        .range(from, to)
      if (error) {
        setHardwareError(error)
        if (error.status === 403) toast.error('Недостаточно прав')
        else toast.error('Ошибка загрузки оборудования: ' + error.message)
        await handleSupabaseError(
          error,
          navigate,
          'Ошибка загрузки оборудования',
        )
      } else {
        setHardware((prev) => [...prev, ...(data || [])])
        if (!data || data.length < PAGE_SIZE) {
          setHardwareHasMore(false)
        } else {
          setHardwarePage(page + 1)
        }
      }
      const { data: apiData, error: apiError } =
        await fetchHardwareApi(objectId)
      if (apiError) {
        if (apiError.status === 403) toast.error('Недостаточно прав')
        else toast.error('Ошибка загрузки оборудования: ' + apiError.message)
      } else {
        setHardware(apiData || [])
      }
      setLoadingHW(false)
    },
    [hardwarePage, navigate, fetchHardwareApi],
  )

  function openHWModal(item = null) {
    if (item) {
      setEditingHW(item)
      resetHW({
        name: item.name,
        location: item.location,
        purchase_status: item.purchase_status,
        install_status: item.install_status,
      })
    } else {
      setEditingHW(null)
      resetHW({ ...defaultHWForm })
    }
    setIsHWModalOpen(true)
  }
  async function saveHardware(data) {
    const payload = { object_id: selected.id, ...data }
    let res
    if (editingHW) {
      res = await updateHardware(editingHW.id, payload)
    } else {
      res = await insertHardware(payload)
    }

    if (res.error) {
      res.error.status === 403
        ? toast.error('Недостаточно прав')
        : toast.error('Ошибка оборудования: ' + res.error.message)
      await handleSupabaseError(res.error, navigate, 'Ошибка оборудования')
      return
    }

    const rec = res.data
    setHardware((prev) =>
      editingHW ? prev.map((h) => (h.id === rec.id ? rec : h)) : [...prev, rec],
    )
    setIsHWModalOpen(false)
    setEditingHW(null)
    resetHW({ ...defaultHWForm })
  }
  function askDeleteHardware(id) {
    setHwDeleteId(id)
  }
  async function confirmDeleteHardware() {
    const id = hwDeleteId
    const { error } = await deleteHardware(id)

    if (error)
      return error.status === 403
        ? toast.error('Недостаточно прав')
        : toast.error('Ошибка удаления: ' + error.message)

    if (error) {
      await handleSupabaseError(error, navigate, 'Ошибка удаления')
      return
    }

    setHardware((prev) => prev.filter((h) => h.id !== id))
    setHwDeleteId(null)
  }

  // --- CRUD Задачи ---

  const fetchTasks = useCallback(
    async (objectId, offset = 0) => {
      setLoadingTasks(true)
      setTasksError(null)
      const { data, error } = await fetchTasksApi(objectId, offset, PAGE_SIZE)
      if (error) {
        setTasksError(error)
        if (error.status === 403) toast.error('Недостаточно прав')
        else toast.error('Ошибка загрузки задач: ' + error.message)
      } else {
        const tasksData = data || []
        setTasks((prev) => (offset === 0 ? tasksData : [...prev, ...tasksData]))
        setTasksHasMore(tasksData.length === PAGE_SIZE)
      }
      setLoadingTasks(false)
    },
    [fetchTasksApi],
  )

  // загрузка данных при смене объекта и восстановление состояния UI
  useEffect(() => {
    if (!selected) return

    // Загрузка данных
    const loadData = async () => {
      setHardware([])
      setTasks([])
      setChatMessages([])

      setHardwarePage(0)
      setHardwareHasMore(true)
      setHardwareError(null)
      setTasksPage(0)
      setTasksHasMore(true)
      setTasksError(null)

      await fetchHardware(selected.id, 0)
      await fetchTasks(selected.id, 0)

      const { data, error } = await fetchMessages(selected.id)
      if (error) {
        if (error.status === 403) toast.error('Недостаточно прав')
        else toast.error('Ошибка загрузки сообщений: ' + error.message)
      } else {
        setChatMessages(data || [])
      }
    }

    // Восстановление состояния UI
    const restoreUIState = () => {
      const savedTab = localStorage.getItem(TAB_KEY(selected.id))
      setTab(savedTab || 'desc')

      // Восстановление формы Hardware
      const savedHWForm = localStorage.getItem(HW_FORM_KEY(selected.id))
      const savedHWOpen =
        localStorage.getItem(HW_MODAL_KEY(selected.id)) === 'true'
      if (savedHWForm) {
        try {
          resetHW(JSON.parse(savedHWForm))
        } catch {
          localStorage.removeItem(HW_FORM_KEY(selected.id))
          resetHW(defaultHWForm)
        }
      } else {
        resetHW(defaultHWForm)
      }
      setIsHWModalOpen(savedHWOpen)

      // Восстановление формы Task
      const savedTaskForm = localStorage.getItem(TASK_FORM_KEY(selected.id))
      const savedTaskOpen =
        localStorage.getItem(TASK_MODAL_KEY(selected.id)) === 'true'
      if (savedTaskForm) {
        try {
          resetTask(JSON.parse(savedTaskForm))
        } catch {
          localStorage.removeItem(TASK_FORM_KEY(selected.id))
          resetTask(defaultTaskForm)
        }
      } else {
        resetTask(defaultTaskForm)
      }
      setIsTaskModalOpen(savedTaskOpen)

      setDescription(selected.description || '')
    }

    restoreUIState()
    loadData()
  }, [selected, resetHW, resetTask, fetchHardware, fetchTasks, fetchMessages])

  function loadMoreTasks() {
    const nextPage = tasksPage + 1
    setTasksPage(nextPage)
    fetchTasks(selected.id, nextPage * PAGE_SIZE)
  }

  function openTaskModal(item = null) {
    if (item) {
      setEditingTask(item)
      resetTask({
        title: item.title,
        status: item.status,
        assignee: item.assignee || '',
        assignee_id: item.assignee_id || '',
        due_date: item.due_date || '',
        notes: item.notes || '',
      })
    } else {
      setEditingTask(null)
      resetTask({ ...defaultTaskForm })
    }
    setShowDatePicker(false)
    setIsTaskModalOpen(true)
  }

  function openTaskView(item) {
    setViewingTask(item)
  }
  async function saveTask(data) {
    const payload = {
      object_id: selected.id,
      title: data.title,
      status: data.status,
      assignee: data.assignee || null,
      assignee_id: data.assignee_id || null,
      due_date: data.due_date || null,
      notes: data.notes || null,
    }
    let res
    if (editingTask) {
      res = await updateTask(editingTask.id, payload)
    } else {
      res = await insertTask(payload)
    }

    if (res.error) {
      res.error.status === 403
        ? toast.error('Недостаточно прав')
        : toast.error('Ошибка задач: ' + res.error.message)
      await handleSupabaseError(res.error, navigate, 'Ошибка задач')
      return
    }

    const rec = res.data
    setTasks((prev) =>
      editingTask
        ? prev.map((t) => (t.id === rec.id ? rec : t))
        : [...prev, rec],
    )
    setIsTaskModalOpen(false)
    setEditingTask(null)
    resetTask({ ...defaultTaskForm })
    toast.success('Задача сохранена')
  }
  function askDeleteTask(id) {
    setTaskDeleteId(id)
  }
  async function confirmDeleteTask() {
    const id = taskDeleteId
    const { error } = await deleteTask(id)

    if (error) {
      error.status === 403
        ? toast.error('Недостаточно прав')
        : toast.error('Ошибка удаления: ' + error.message)
      await handleSupabaseError(error, navigate, 'Ошибка удаления')
      return
    }

    setTasks((prev) => prev.filter((t) => t.id !== id))
    setTaskDeleteId(null)
  }

  // --- экспорт/импорт ---
  function openImportModal(table) {
    setImportTable(table)
    setImportFile(null)
  }

  function closeImportModal() {
    setImportTable(null)
    setImportFile(null)
  }

  async function handleImport() {
    if (!importTable || !importFile) return
    if (!isApiConfigured) {
      toast.error('API не настроен')
      return
    }
    const formData = new FormData()
    formData.append('file', importFile)
    try {
      const res = await fetch(`${apiBaseUrl}/import/${importTable}`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Ошибка импорта')
      toast.success('Импорт выполнен')
      closeImportModal()
      if (importTable === 'hardware') {
        setHardware([])
        setHardwarePage(0)
        setHardwareHasMore(true)
        await fetchHardware(selected.id, 0)
      } else if (importTable === 'tasks') {
        setTasks([])
        setTasksPage(0)
        setTasksHasMore(true)
        await fetchTasks(selected.id, 0)
      }
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function handleExport(table, format = 'csv') {
    if (!isApiConfigured) {
      toast.error('API не настроен')
      return
    }
    try {
      const res = await fetch(`${apiBaseUrl}/export/${table}.${format}`)
      if (!res.ok) throw new Error('Ошибка экспорта')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${table}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Вкладки */}
      <div className="flex mb-4 border-b">
        <button
          className={`px-4 py-2 hover:bg-primary/10 ${tab === 'desc' ? 'border-b-2 border-primary' : ''}`}
          onClick={showDesc}
        >
          Описание
        </button>
        <button
          className={`px-4 py-2 hover:bg-primary/10 ${tab === 'hw' ? 'border-b-2 border-primary' : ''}`}
          onClick={showHW}
        >
          Железо ({hardware.length})
        </button>
        <button
          className={`px-4 py-2 hover:bg-primary/10 ${tab === 'tasks' ? 'border-b-2 border-primary' : ''}`}
          onClick={showTasks}
        >
          Задачи ({tasks.length})
        </button>
        <button
          className={`px-4 py-2 hover:bg-primary/10 flex items-center gap-1 ${tab === 'chat' ? 'border-b-2 border-primary' : ''}`}
          onClick={showChat}
        >
          <ChatBubbleOvalLeftIcon className="w-4 h-4" /> Чат (
          {chatMessages.length})
        </button>
      </div>

      <div className="flex-1 flex flex-col h-full min-h-0 overflow-auto p-4">
        {/* Описание */}
        {tab === 'desc' && (
          <div>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{selected.name}</h3>
              {!isEditingDesc && (
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setIsEditingDesc(true)}
                >
                  Редактировать
                </button>
              )}
            </div>
            {isEditingDesc ? (
              <>
                <textarea
                  className="textarea textarea-bordered w-full mt-4"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="mt-2 flex space-x-2">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={saveDescription}
                  >
                    Сохранить
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setIsEditingDesc(false)}
                  >
                    Отмена
                  </button>
                </div>
              </>
            ) : description ? (
              <p className="mt-2 whitespace-pre-wrap break-all">
                {linkifyText(description)}
              </p>
            ) : (
              <p className="mt-2">Нет описания</p>
            )}
          </div>
        )}

        {/* Оборудование */}
        {tab === 'hw' && (
          <div>
            <div className="flex justify-between mb-4">
              <h3 className="text-xl font-semibold">Оборудование</h3>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleExport('hardware')}
                >
                  Экспорт
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => openImportModal('hardware')}
                >
                  Импорт
                </button>
                <button
                  className="btn btn-sm btn-primary flex items-center gap-1"
                  onClick={() => openHWModal()}
                >
                  <PlusIcon className="w-4 h-4" /> Добавить
                </button>
              </div>
            </div>
            {loadingHW && <Spinner />}
            {hardwareError && (
              <ErrorMessage
                error={hardwareError}
                message="Ошибка загрузки оборудования"
              />
            )}
            {!loadingHW && !hardwareError && (
              <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {hardware.map((h) => (
                  <HardwareCard
                    key={h.id}
                    item={h}
                    onEdit={() => openHWModal(h)}
                    onDelete={() => askDeleteHardware(h.id)}
                    user={user}
                  />
                ))}
              </div>
            )}
            {hardwareHasMore && !loadingHW && (
              <button
                className="btn btn-outline btn-sm mt-2"
                onClick={() => fetchHardware(selected.id, hardwarePage)}
              >
                Загрузить ещё
              </button>
            )}

            {isHWModalOpen && (
              <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto animate-fade-in">
                  <button
                    className="btn btn-circle absolute right-2 top-2 xs:btn-md md:btn-sm"
                    onClick={() => setIsHWModalOpen(false)}
                  >
                    ✕
                  </button>
                  <h3 className="font-bold text-lg mb-4">
                    {editingHW ? 'Редактировать' : 'Добавить'} оборудование
                  </h3>

                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Название устройства</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Например, keenetic giga"
                        {...registerHW('name')}
                      />
                      {hwErrors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {hwErrors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Местоположение</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        placeholder="Где стоит"
                        {...registerHW('location')}
                      />
                      {hwErrors.location && (
                        <p className="text-red-500 text-sm mt-1">
                          {hwErrors.location.message}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col sm2:flex-row sm2:space-x-4 space-y-4 sm2:space-y-0">
                      <div className="form-control flex-1">
                        <label className="label">
                          <span className="label-text">Статус покупки</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          {...registerHW('purchase_status')}
                        >
                          <option value="не оплачен">Не оплачен</option>
                          <option value="оплачен">Оплачен</option>
                        </select>
                        {hwErrors.purchase_status && (
                          <p className="text-red-500 text-sm mt-1">
                            {hwErrors.purchase_status.message}
                          </p>
                        )}
                      </div>
                      <div className="form-control flex-1">
                        <label className="label">
                          <span className="label-text">Статус установки</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          {...registerHW('install_status')}
                        >
                          <option value="не установлен">Не установлен</option>
                          <option value="установлен">Установлен</option>
                        </select>
                        {hwErrors.install_status && (
                          <p className="text-red-500 text-sm mt-1">
                            {hwErrors.install_status.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="modal-action flex space-x-2">
                    <button
                      className="btn btn-primary"
                      onClick={handleSubmitHW(saveHardware)}
                    >
                      Сохранить
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => setIsHWModalOpen(false)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            <ConfirmModal
              open={!!hwDeleteId}
              title="Удалить оборудование?"
              onConfirm={confirmDeleteHardware}
              onCancel={() => setHwDeleteId(null)}
            />
          </div>
        )}

        {/* Задачи */}
        {tab === 'tasks' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-4">
              <h3 className="text-xl font-semibold">Задачи</h3>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => handleExport('tasks')}
                >
                  Экспорт
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => openImportModal('tasks')}
                >
                  Импорт
                </button>
                {user && (
                  <button
                    className="btn btn-sm btn-primary flex items-center gap-1"
                    onClick={() => openTaskModal()}
                  >
                    <PlusIcon className="w-4 h-4" /> Добавить задачу
                  </button>
                )}
              </div>
            </div>
            {loadingTasks && <Spinner />}
            {tasksError && (
              <ErrorMessage
                error={tasksError}
                message="Ошибка загрузки задач"
              />
            )}
            {!loadingTasks && !tasksError && (
              <>
                {tasks.length === 0 && <p>Задачи не найдены</p>}
                <div className="grid gap-2 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {tasks.map((t) => (
                    <TaskCard
                      key={t.id}
                      item={t}
                      onView={() => openTaskView(t)}
                      onEdit={() => openTaskModal(t)}
                      onDelete={() => askDeleteTask(t.id)}
                    />
                  ))}
                </div>
              </>
            )}
            {tasksHasMore && !loadingTasks && (
              <button
                className="btn btn-outline btn-sm mt-2"
                onClick={loadMoreTasks}
              >
                Загрузить ещё
              </button>
            )}

            {isTaskModalOpen && (
              <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto animate-fade-in">
                  <button
                    className="btn btn-circle absolute right-2 top-2 xs:btn-md md:btn-sm"
                    onClick={() => setIsTaskModalOpen(false)}
                  >
                    ✕
                  </button>
                  <h3 className="font-bold text-lg mb-4">
                    {editingTask ? 'Редактировать' : 'Добавить'} задачу
                  </h3>
                  <div className="space-y-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Заголовок задачи</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        {...registerTask('title')}
                      />
                      {taskErrors.title && (
                        <p className="text-red-500 text-sm mt-1">
                          {taskErrors.title.message}
                        </p>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Исполнитель</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        {...registerTask('assignee')}
                      />
                      <input type="hidden" {...registerTask('assignee_id')} />
                      {taskErrors.assignee && (
                        <p className="text-red-500 text-sm mt-1">
                          {taskErrors.assignee.message}
                        </p>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label flex items-center">
                        <span className="label-text">Дата</span>
                        <button
                          type="button"
                          className="ml-2 btn btn-ghost btn-xs"
                          onClick={() => setShowDatePicker((s) => !s)}
                        >
                          📅
                        </button>
                      </label>
                      {showDatePicker && (
                        <input
                          type="date"
                          className="input input-bordered w-full"
                          {...registerTask('due_date')}
                        />
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Статус</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        {...registerTask('status')}
                      >
                        <option value="запланировано">Запланировано</option>
                        <option value="в процессе">В процессе</option>
                        <option value="завершено">Завершено</option>
                      </select>
                      {taskErrors.status && (
                        <p className="text-red-500 text-sm mt-1">
                          {taskErrors.status.message}
                        </p>
                      )}
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Заметки</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered w-full"
                        rows={3}
                        {...registerTask('notes')}
                      />
                      {taskErrors.notes && (
                        <p className="text-red-500 text-sm mt-1">
                          {taskErrors.notes.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="modal-action flex flex-col xs:flex-row space-y-2 xs:space-y-0 xs:space-x-2">
                    <button
                      className="btn btn-primary w-full xs:w-auto"
                      onClick={handleSubmitTask(saveTask)}
                    >
                      Сохранить
                    </button>
                    <button
                      className="btn btn-ghost w-full xs:w-auto"
                      onClick={() => setIsTaskModalOpen(false)}
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}

            {viewingTask && (
              <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto animate-fade-in">
                  <button
                    className="btn btn-circle absolute right-2 top-2 xs:btn-md md:btn-sm"
                    onClick={() => setViewingTask(null)}
                  >
                    ✕
                  </button>
                  <h3 className="font-bold text-lg mb-4">
                    {viewingTask.title}
                  </h3>
                  <div className="space-y-2">
                    {viewingTask.assignee && (
                      <p>
                        <strong>Исполнитель:</strong> {viewingTask.assignee}
                      </p>
                    )}
                    {viewingTask.due_date && (
                      <p>
                        <strong>Дата:</strong>{' '}
                        {formatDate(viewingTask.due_date)}
                      </p>
                    )}
                    <p>
                      <strong>Статус:</strong> {viewingTask.status}
                    </p>
                    {viewingTask.notes && (
                      <p className="whitespace-pre-wrap break-words">
                        <strong>Заметки:</strong> {viewingTask.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <ConfirmModal
              open={!!taskDeleteId}
              title="Удалить задачу?"
              onConfirm={confirmDeleteTask}
              onCancel={() => setTaskDeleteId(null)}
            />
          </div>
        )}

        {importTable && (
          <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto animate-fade-in">
              <button
                className="btn btn-circle absolute right-2 top-2 xs:btn-md md:btn-sm"
                onClick={closeImportModal}
              >
                ✕
              </button>
              <h3 className="font-bold text-lg mb-4">
                Импорт {importTable === 'hardware' ? 'оборудования' : 'задач'}
              </h3>
              <input
                type="file"
                className="file-input file-input-bordered w-full"
                onChange={(e) => setImportFile(e.target.files[0])}
              />
              <div className="modal-action flex space-x-2">
                <button className="btn btn-primary" onClick={handleImport}>
                  Загрузить
                </button>
                <button className="btn btn-ghost" onClick={closeImportModal}>
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Чат */}
        {tab === 'chat' && (
          <ChatTab
            key={selected?.id}
            selected={selected}
            userEmail={user?.email}
          />
        )}
      </div>
    </div>
  )
}

export default React.memo(InventoryTabs)

InventoryTabs.propTypes = {
  selected: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
  }).isRequired,
  onUpdateSelected: PropTypes.func.isRequired,
  onTabChange: PropTypes.func,
}

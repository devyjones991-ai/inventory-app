import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'react-hot-toast'
import { PlusIcon } from '@heroicons/react/24/outline'
import ConfirmModal from './ConfirmModal'
import Spinner from './Spinner'
import ErrorMessage from './ErrorMessage'
import TaskCard from './TaskCard'
import { handleSupabaseError } from '../utils/handleSupabaseError'
import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { apiBaseUrl, isApiConfigured } from '../apiConfig'

const TASK_MODAL_KEY = (objectId) => `taskModal_${objectId}`
const TASK_FORM_KEY = (objectId) => `taskForm_${objectId}`
const PAGE_SIZE = 20

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU')
  } catch {
    return dateStr
  }
}

function TasksTab({ selected }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const objectId = selected?.id

  // --- задачи ---
  const [tasks, setTasks] = useState([])
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
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

  // импорт/экспорт
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importFile, setImportFile] = useState(null)

  const {
    fetchTasks: fetchTasksApi,
    insertTask,
    updateTask,
    deleteTask,
    subscribeToTasks,
  } = useTasks()

  // загрузка данных при смене объекта и восстановление состояния UI
  useEffect(() => {
    if (!objectId) return
    const savedTaskForm =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(TASK_FORM_KEY(objectId))
        : null
    const savedTaskOpen =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(TASK_MODAL_KEY(objectId)) === 'true'
        : false
    let parsedTaskForm = defaultTaskForm
    if (savedTaskForm) {
      try {
        parsedTaskForm = JSON.parse(savedTaskForm)
      } catch {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(TASK_FORM_KEY(objectId))
        }
      }
    }
    resetTask(parsedTaskForm)
    if (savedTaskOpen && typeof localStorage !== 'undefined') {
      localStorage.setItem(
        TASK_FORM_KEY(objectId),
        JSON.stringify(parsedTaskForm),
      )
    }
    setIsTaskModalOpen(savedTaskOpen)

    setTasks([])
    setTasksPage(0)
    setTasksHasMore(true)
    setTasksError(null)

    fetchTasks(objectId, 0)
  }, [objectId])

  useEffect(() => {
    if (!objectId) return
    if (taskEffectRan.current) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TASK_MODAL_KEY(objectId), isTaskModalOpen)
        if (!isTaskModalOpen) {
          localStorage.removeItem(TASK_FORM_KEY(objectId))
        }
      }
    } else {
      taskEffectRan.current = true
    }
  }, [isTaskModalOpen, objectId])

  useEffect(() => {
    if (!objectId || !isTaskModalOpen) return
    const sub = watchTask((value) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(TASK_FORM_KEY(objectId), JSON.stringify(value))
      }
    })
    return () => sub.unsubscribe()
  }, [watchTask, objectId, isTaskModalOpen])

  // realtime обновление задач
  useEffect(() => {
    if (!objectId) return
    const unsubscribeTasks = subscribeToTasks(objectId, (payload) => {
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

    return () => {
      unsubscribeTasks()
    }
  }, [objectId])

  async function fetchTasks(objectId, offset = 0) {
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
  }

  function loadMoreTasks() {
    const nextPage = tasksPage + 1
    setTasksPage(nextPage)
    fetchTasks(objectId, nextPage * PAGE_SIZE)
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
      object_id: objectId,
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

    if (error)
      return error.status === 403
        ? toast.error('Недостаточно прав')
        : toast.error('Ошибка удаления: ' + error.message)

    setTasks((prev) => prev.filter((t) => t.id !== id))
    setTaskDeleteId(null)
  }

  function openImportModal() {
    setIsImportModalOpen(true)
    setImportFile(null)
  }

  function closeImportModal() {
    setIsImportModalOpen(false)
    setImportFile(null)
  }

  async function handleImport() {
    if (!importFile) return
    if (!isApiConfigured) {
      toast.error('API не настроен')
      return
    }
    const formData = new FormData()
    formData.append('file', importFile)
    try {
      const res = await fetch(`${apiBaseUrl}/import/tasks`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) throw new Error('Ошибка импорта')
      toast.success('Импорт выполнен')
      closeImportModal()
      setTasks([])
      setTasksPage(0)
      setTasksHasMore(true)
      await fetchTasks(objectId, 0)
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function handleExport(format = 'csv') {
    if (!isApiConfigured) {
      toast.error('API не настроен')
      return
    }
    try {
      const res = await fetch(`${apiBaseUrl}/export/tasks.${format}`)
      if (!res.ok) throw new Error('Ошибка экспорта')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tasks.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (!objectId) {
    return <p>Задачи не найдены</p>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mb-4">
        <h3 className="text-xl font-semibold">Задачи</h3>
        <div className="flex gap-2">
          <button
            className="btn btn-sm btn-outline"
            onClick={() => handleExport()}
          >
            Экспорт
          </button>
          <button className="btn btn-sm btn-outline" onClick={openImportModal}>
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
        <ErrorMessage error={tasksError} message="Ошибка загрузки задач" />
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
        <button className="btn btn-outline btn-sm mt-2" onClick={loadMoreTasks}>
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
            <h3 className="font-bold text-lg mb-4">{viewingTask.title}</h3>
            <div className="space-y-2">
              {viewingTask.assignee && (
                <p>
                  <strong>Исполнитель:</strong> {viewingTask.assignee}
                </p>
              )}
              {viewingTask.due_date && (
                <p>
                  <strong>Дата:</strong> {formatDate(viewingTask.due_date)}
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

      {isImportModalOpen && (
        <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="modal-box relative w-full max-w-md p-4 max-h-screen overflow-y-auto animate-fade-in">
            <button
              className="btn btn-circle absolute right-2 top-2 xs:btn-md md:btn-sm"
              onClick={closeImportModal}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">Импорт задач</h3>
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
    </div>
  )
}

TasksTab.propTypes = {
  selected: PropTypes.shape({ id: PropTypes.string.isRequired }),
}

export default TasksTab
